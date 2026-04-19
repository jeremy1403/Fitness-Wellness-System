<?php
namespace App\DTOs\Membership;

class UpdateSubscriptionData
{
    public function __construct(
        public readonly string $status,
    ) {}
}