<?php

namespace App\Domain\Booking\Policies;

use App\Models\User;
use App\Models\ClassSchedule;

interface BookingPolicyInterface
{
    public function canBook(User $user, ClassSchedule $schedule): void;
}