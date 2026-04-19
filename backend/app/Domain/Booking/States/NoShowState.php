<?php

namespace App\Domain\Booking\States;

use Exception;

class NoShowState implements BookingStateInterface
{
    public function cancel(): string
    {
        throw new Exception('Cannot cancel a booking that has been marked as no-show.');
    }

    public function markAttended(): string
    {
        return 'attended';
    }

    public function markNoShow(): string
    {
        throw new Exception('Booking is already marked as no-show.');
    }
}