<?php

namespace App\Services\Contracts;

interface PromoServiceInterface
{
    /**
     * Validate a promo code and return its details if valid.
     *
     * @param string $code
     * @param int|null $userId
     * @return array
     */
    public function validateCode(string $code, ?int $userId = null): array;
}
