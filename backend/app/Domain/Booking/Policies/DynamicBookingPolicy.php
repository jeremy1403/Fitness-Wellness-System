<?php

namespace App\Domain\Booking\Policies;

use App\Models\User;
use App\Models\ClassSchedule;
use App\Repositories\Contracts\BookingRepositoryInterface;
use Exception;

/**
 * DynamicBookingPolicy
 *
 * Used when the user has an active membership.
 * Booking rules are driven by the membership plan's actual limits
 * (booking_daily_limit and booking_advance_days) from the Membership module.
 */
class DynamicBookingPolicy implements BookingPolicyInterface
{
    public function __construct(
        private readonly BookingRepositoryInterface $bookingRepository,
        private readonly int $dailyLimit,
        private readonly int $advanceDays,
        private readonly string $planName,
    ) {}

    public function canBook(User $user, ClassSchedule $schedule): void
    {
        $count = $this->bookingRepository
            ->countUserBookingsForDate($user->id, $schedule->start_datetime->toDateString());

        if ($count >= $this->dailyLimit) {
            throw new Exception(
                "{$this->planName} plan allows only {$this->dailyLimit} booking(s) per day."
            );
        }

        if ($schedule->start_datetime > now()->addDays($this->advanceDays)) {
            throw new Exception(
                "{$this->planName} plan allows booking only within {$this->advanceDays} days in advance."
            );
        }
    }
}