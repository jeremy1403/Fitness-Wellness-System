<?php

namespace App\Services;

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
        private readonly BookingRepositoryInterface $bookingRepository
    ) {}

    // 1. Prevent duplicate booking
    public function createBooking(User $user, int $scheduleId): Booking
    {
        if ($this->bookingRepository->existsForSchedule($user->id, $scheduleId)) {
            throw new Exception('You have already booked this class.');
        }

        $schedule = ClassSchedule::findOrFail($scheduleId);

        $policy = BookingStrategyFactory::make($user, $this->bookingRepository);
        $policy->canBook($user, $schedule);

        $currentBookings = $this->bookingRepository->countBookingsForSchedule($scheduleId);

        if ($currentBookings >= $schedule->capacity) {
            throw new Exception('This class is already full.');
        }

        return $this->bookingRepository->create([
            'user_id'           => $user->id,
            'class_schedule_id' => $scheduleId,
            'status'            => 'booked',
            'booked_at'         => now(),
        ]);
    }

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

        // State Pattern: delegate transition validation to the current state
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

        // State Pattern: delegate transition validation to the current state
        $newStatus = $booking->getState()->cancel();

        return $this->bookingRepository->update($booking, [
            'status'       => $newStatus,
            'cancelled_at' => now(),
        ]);
    }

    /**
     * State Pattern: trainer marks a booking as attended or no_show.
     * Transition rules are enforced by the current BookingState.
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