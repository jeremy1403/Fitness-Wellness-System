<?php

namespace App\Domain\Booking\States;

use Exception;

class BookedState implements BookingStateInterface
{
    public function cancel(): string
    {
        return 'cancelled';
    }

    public function markAttended(): string
    {
        return 'attended';
    }

    public function markNoShow(): string
    {
        return 'no_show';
    }
}