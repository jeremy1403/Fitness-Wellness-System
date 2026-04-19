<?php

namespace App\Domain\Booking\States;

use Exception;

class AttendedState implements BookingStateInterface
{
    public function cancel(): string
    {
        throw new Exception('Cannot cancel a booking that has already been attended.');
    }

    public function markAttended(): string
    {
        throw new Exception('Booking is already marked as attended.');
    }

    public function markNoShow(): string
    {
        return 'no_show';
    }
}