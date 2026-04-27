<?php
namespace App\DTOs\Membership;

class CreatePlanData
{
    public function __construct(
        public readonly string $tierName,
        public readonly string $billingCycle,
        public readonly float $price,
        public readonly int $bookingDailyLimit,
        public readonly int $bookingAdvanceDays,
        public readonly string $status = 'active',
    ) {}
}