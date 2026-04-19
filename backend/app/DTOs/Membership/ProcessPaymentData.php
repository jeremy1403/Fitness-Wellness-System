<?php
namespace App\DTOs\Membership;

class ProcessPaymentData
{
    public function __construct(
        public readonly int $userId,
        public readonly int $membershipId,
        public readonly float $amount,
        public readonly string $method,
        // Promo Code integration fields (Member 5 ↔ Member 4)
        public readonly ?string $promoCode       = null,
        public readonly ?int    $promoCodeId      = null,
        public readonly float   $discountApplied  = 0.0,
    ) {}
}