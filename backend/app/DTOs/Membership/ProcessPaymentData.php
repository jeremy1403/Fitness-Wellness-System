<?php
namespace App\DTOs\Membership;

class ProcessPaymentData
{
    public function __construct(
        public readonly int $userId,
        public readonly int $membershipId,
        public readonly float $amount,
        public readonly string $method,
    ) {}
}