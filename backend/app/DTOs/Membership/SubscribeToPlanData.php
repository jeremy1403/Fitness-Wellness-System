<?php
namespace App\DTOs\Membership;

class SubscribeToPlanData
{
    public function __construct(
        public readonly int $userId,
        public readonly int $planId,
        public readonly string $paymentMethod,
    ) {}
}