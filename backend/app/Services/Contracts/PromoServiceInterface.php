<?php

namespace App\Services\Contracts;

interface PromoServiceInterface
{
    /**
     * Validate a promo code and return its details if valid.
     *
     * @param string $code
     * @param int|null $userId
     * @param float $cartSubtotal
     * @return array
     */
    public function validateCode(string $code, ?int $userId = null, float $cartSubtotal = 0.0): array;
}
