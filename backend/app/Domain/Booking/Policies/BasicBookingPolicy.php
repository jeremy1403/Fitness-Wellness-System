<?php

namespace App\Domain\Booking\Policies;

use App\Models\User;
use App\Models\ClassSchedule;
use App\Repositories\Contracts\BookingRepositoryInterface;
use Exception;

class BasicBookingPolicy implements BookingPolicyInterface
{
    public function __construct(
        private readonly BookingRepositoryInterface $bookingRepository
    ) {}

    public function canBook(User $user, ClassSchedule $schedule): void
    {
        $count = $this->bookingRepository
            ->countUserBookingsForDate($user->id, $schedule->start_datetime->toDateString());

        if ($count >= 1) {
            throw new Exception('Basic plan allows only 1 booking per day.');
        }

        if ($schedule->start_datetime > now()->addDays(3)) {
            throw new Exception('Basic plan allows booking only within 3 days in advance.');
        }
    }
}