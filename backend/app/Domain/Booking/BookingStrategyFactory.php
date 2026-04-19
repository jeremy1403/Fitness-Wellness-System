<?php

namespace App\Domain\Booking;

use App\Domain\Booking\Policies\BasicBookingPolicy;
use App\Domain\Booking\Policies\PremiumBookingPolicy;
use App\Domain\Booking\Policies\BookingPolicyInterface;
use App\Domain\Booking\Policies\DynamicBookingPolicy;
use App\Models\User;
use App\Repositories\Contracts\BookingRepositoryInterface;
use App\Services\MembershipService;

class BookingStrategyFactory
{
    public static function make(
        User $user,
        BookingRepositoryInterface $bookingRepository
    ): BookingPolicyInterface {
        // Resolve MembershipService from the container
        $membershipService = app(MembershipService::class);

        // Look up user's active membership
        $membership = $membershipService->getActiveMembership($user->id);

        if ($membership && $membership->plan) {
            // Use the plan's actual limits from the Membership module
            return new DynamicBookingPolicy(
                $bookingRepository,
                $membership->plan->booking_daily_limit,
                $membership->plan->booking_advance_days,
                $membership->plan->name,
            );
        }

        // No active membership — fall back to Basic rules
        return new BasicBookingPolicy($bookingRepository);
    }
}