<?php

namespace App\Domain\Booking;

use App\Domain\Booking\States\AttendedState;
use App\Domain\Booking\States\BookedState;
use App\Domain\Booking\States\BookingStateInterface;
use App\Domain\Booking\States\CancelledState;
use App\Domain\Booking\States\NoShowState;
use Exception;

class BookingStateFactory
{
    public static function make(string $status): BookingStateInterface
    {
        return match ($status) {
            'booked'    => new BookedState(),
            'cancelled' => new CancelledState(),
            'attended'  => new AttendedState(),
            'no_show'   => new NoShowState(),
            default     => throw new Exception("Unknown booking status: {$status}"),
        };
    }
}