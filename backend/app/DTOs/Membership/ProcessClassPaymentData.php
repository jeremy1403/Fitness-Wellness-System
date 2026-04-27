<?php

namespace App\DTOs\Membership;

/**
 * ProcessClassPaymentData
 *
 * DTO for paying for a single fitness class booking (pay-per-class / à-la-carte).
 * Distinct from ProcessPaymentData which is used for membership subscription payments.
 */
final class ProcessClassPaymentData
{
    public function __construct(
        public readonly int     $userId,
        public readonly int     $scheduleId,
        public readonly float   $amount,
        public readonly string  $method,
        public readonly ?string $promoCode = null,
    ) {}
}
