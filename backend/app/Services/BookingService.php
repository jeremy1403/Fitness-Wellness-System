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
            'user_id' => $user->id,
            'class_schedule_id' => $scheduleId,
            'status' => 'booked',
            'booked_at' => now(),
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

        if ($booking->isCancelled()) {
            throw new Exception('Booking already cancelled.');
        }

        return $this->bookingRepository->update($booking, [
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }
}