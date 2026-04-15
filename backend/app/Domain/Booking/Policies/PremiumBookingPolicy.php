<?php

namespace App\Domain\Booking\Policies;

use App\Models\User;
use App\Models\ClassSchedule;
use App\Repositories\Contracts\BookingRepositoryInterface;
use Exception;

class PremiumBookingPolicy implements BookingPolicyInterface
{
    public function __construct(
        private readonly BookingRepositoryInterface $bookingRepository
    ) {}

    public function canBook(User $user, ClassSchedule $schedule): void
    {
        $count = $this->bookingRepository
            ->countUserBookingsForDate($user->id, $schedule->start_datetime->toDateString());

        if ($count >= 3) {
            throw new Exception('Premium plan allows only 3 bookings per day.');
        }

        if ($schedule->start_datetime > now()->addDays(14)) {
            throw new Exception('Premium plan allows booking only within 14 days in advance.');
        }
    }
}