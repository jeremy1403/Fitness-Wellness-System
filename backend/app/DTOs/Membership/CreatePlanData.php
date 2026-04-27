<?php
namespace App\DTOs\Membership;

class CreatePlanData
{
    public function __construct(
        public readonly string $tierName,
        public readonly string $billingCycle,
        public readonly float $price,
        public readonly int $dailyFreeQuota,
        public readonly int|null $maxDailyBookings,
        public readonly int $bookingAdvanceDays,
        public readonly string $status = 'active',
    ) {}
}