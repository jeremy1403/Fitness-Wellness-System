<?php

namespace App\Services;

use App\Domain\Booking\BookingResult;
use App\Domain\Booking\BookingStrategyFactory;
use App\Models\Booking;
use App\Models\ClassSchedule;
use App\Models\User;
use App\Repositories\Contracts\BookingRepositoryInterface;
use Exception;
use Illuminate\Database\Eloquent\Collection;

class BookingService
{
    public function __construct(
        private readonly BookingRepositoryInterface $bookingRepository,
        private readonly MembershipService          $membershipService,
    ) {}

    public const FLAT_CLASS_RATE = 10.00;

    // =========================================================================
    // CORE: Daily Quota + Pay-Per-Class Decision Engine
    // =========================================================================

    /**
     * Attempt to create a booking for a user.
     *
     * Returns a BookingResult that signals one of two outcomes:
     *
     *   BookingResult::quotaUsed()         → status='confirmed',       is_quota_used=true
     *   BookingResult::paymentRequired()   → status='pending_payment', is_quota_used=false
     *
     * Hard-block conditions still throw Exception (duplicate, full class, advance-day limit).
     */
    public function createBooking(User $user, int $scheduleId): BookingResult
    {
        // ── 1. Prevent duplicate booking ──────────────────────────────────────
        if ($this->bookingRepository->existsForSchedule($user->id, $scheduleId)) {
            throw new Exception('You have already booked this class.');
        }

        // ── 2. Load schedule & validate it is still open ─────────────────────
        $schedule = ClassSchedule::with('fitnessClass')->findOrFail($scheduleId);

        if (!$schedule->isOpen()) {
            throw new Exception('This class schedule is no longer open for booking.');
        }

        // ── 3. Capacity check (pending_payment bookings also hold a seat) ────
        $currentBookings = $this->bookingRepository->countBookingsForSchedule($scheduleId);

        if ($currentBookings >= $schedule->capacity) {
            throw new Exception('This class is already full.');
        }

        // ── 4. Advance-booking constraint from membership plan ───────────────
        //    (still enforced via DynamicBookingPolicy for paid members)
        $membership = $this->membershipService->getActiveMembership($user->id);

        if ($membership && $membership->plan) {
            $advanceDays = $membership->plan->booking_advance_days;
            if ($schedule->start_datetime > now()->addDays($advanceDays)) {
                throw new Exception(
                    "{$membership->plan->name} plan allows booking only within {$advanceDays} day(s) in advance."
                );
            }
        }

        // ── 5. Determine daily quota ──────────────────────────────────────────
        //    Free Tier (no active membership) → quota = 0 (always pays)
        //    Any active plan                  → quota = plan.booking_daily_limit
        $dailyQuota = 0;

        if ($membership && $membership->plan) {
            $dailyQuota = (int) $membership->plan->booking_daily_limit;
        }

        // ── 6. Count how many active bookings the user already has today ──────
        $classDate      = $schedule->start_datetime->toDateString();
        $todayBookings  = $this->bookingRepository->countActiveBookingsForDate($user->id, $classDate);

        // ── 7. Decision Engine ────────────────────────────────────────────────
        $classPrice = self::FLAT_CLASS_RATE;

        if ($dailyQuota > 0 && $todayBookings < $dailyQuota) {
            // ✅ Quota available — book for free
            $booking = $this->bookingRepository->create([
                'user_id'           => $user->id,
                'class_schedule_id' => $scheduleId,
                'status'            => 'confirmed',
                'is_quota_used'     => true,
                'booked_at'         => now(),
            ]);

            return BookingResult::quotaUsed($booking);
        }

        // 💳 Quota exhausted or Free Tier — requires payment
        $booking = $this->bookingRepository->create([
            'user_id'           => $user->id,
            'class_schedule_id' => $scheduleId,
            'status'            => 'pending_payment',
            'is_quota_used'     => false,
            'booked_at'         => now(),
        ]);

        return BookingResult::paymentRequired($booking, $classPrice);
    }

    // =========================================================================
    // OTHER BOOKING OPERATIONS (unchanged behaviour)
    // =========================================================================

    public function getUserBookings(User $user): Collection
    {
        return $this->bookingRepository->findByUser($user->id);
    }

    public function cancelBooking(User $user, int $bookingId): Booking
    {
        $booking = $this->bookingRepository->findById($bookingId);

        if (!$booking || $booking->user_id !== $user->id) {
            throw new Exception('Booking not found.');
        }

        // State Pattern: both ConfirmedState and PendingPaymentState allow cancel()
        $newStatus = $booking->getState()->cancel();

        return $this->bookingRepository->update($booking, [
            'status'       => $newStatus,
            'cancelled_at' => now(),
        ]);
    }

    public function getAllBookings(): Collection
    {
        return $this->bookingRepository->findAll();
    }

    public function adminCancelBooking(int $bookingId): Booking
    {
        $booking = $this->bookingRepository->findById($bookingId);

        if (!$booking) {
            throw new Exception('Booking not found.');
        }

        $newStatus = $booking->getState()->cancel();

        return $this->bookingRepository->update($booking, [
            'status'       => $newStatus,
            'cancelled_at' => now(),
        ]);
    }

    /**
     * State Pattern: trainer marks a booking as attended or no_show.
     * PendingPaymentState will throw if the booking hasn't been paid yet.
     */
    public function updateAttendance(int $bookingId, string $newStatus): Booking
    {
        $booking = $this->bookingRepository->findById($bookingId);

        if (!$booking) {
            throw new Exception('Booking not found.');
        }

        $resolvedStatus = match ($newStatus) {
            'attended' => $booking->getState()->markAttended(),
            'no_show'  => $booking->getState()->markNoShow(),
            default    => throw new Exception("Invalid attendance status: {$newStatus}"),
        };

        return $this->bookingRepository->update($booking, [
            'status' => $resolvedStatus,
        ]);
    }

    /**
     * Trainer: get all bookings for a specific schedule.
     */
    public function getScheduleBookings(int $scheduleId): Collection
    {
        return $this->bookingRepository->findBySchedule($scheduleId);
    }
}