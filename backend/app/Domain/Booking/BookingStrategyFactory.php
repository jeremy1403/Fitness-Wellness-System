<?php

namespace App\Domain\Booking;

use App\Domain\Booking\Policies\BasicBookingPolicy;
use App\Domain\Booking\Policies\PremiumBookingPolicy;
use App\Domain\Booking\Policies\BookingPolicyInterface;
use App\Models\User;
use App\Repositories\Contracts\BookingRepositoryInterface;

class BookingStrategyFactory
{
    public static function make(
        User $user,
        BookingRepositoryInterface $bookingRepository
    ): BookingPolicyInterface {
        // Temporary rule until Membership module is ready.
        // Replace later with real membership/plan lookup.
        if ($user->email === 'jr@fitness.test') {
            return new PremiumBookingPolicy($bookingRepository);
        }

        return new BasicBookingPolicy($bookingRepository);
    }
}