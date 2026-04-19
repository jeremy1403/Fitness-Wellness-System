<?php

namespace App\Domain\Booking\States;

interface BookingStateInterface
{
    public function cancel(): string;

    public function markAttended(): string;

    public function markNoShow(): string;
}