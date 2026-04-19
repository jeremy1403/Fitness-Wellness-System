<?php

namespace App\Domain\Booking\States;

use Exception;

class CancelledState implements BookingStateInterface
{
    public function cancel(): string
    {
        throw new Exception('Cannot cancel a booking that is already cancelled.');
    }

    public function markAttended(): string
    {
        throw new Exception('Cannot mark attendance on a cancelled booking.');
    }

    public function markNoShow(): string
    {
        throw new Exception('Cannot mark no-show on a cancelled booking.');
    }
}