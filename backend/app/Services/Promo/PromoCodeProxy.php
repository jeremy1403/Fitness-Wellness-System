<?php

namespace App\Services\Promo;

use App\Services\Contracts\PromoServiceInterface;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class PromoCodeProxy implements PromoServiceInterface
{
    private PromoServiceInterface $realService;

    public function __construct(PromoServiceInterface $realService)
    {
        $this->realService = $realService;
    }

    /**
     * Intercepts the request to add Rate Limiting before hitting the DB logic.
     */
    public function validateCode(string $code, ?int $userId = null): array
    {
        // Use IP or User ID for rate limiting key
        $key = 'promo_validate_' . ($userId ?? request()->ip());
        
        // Rate Limiting (Brute-force protection): Max 5 attempts per minute
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'code' => ["Too many attempts. Please try again in {$seconds} seconds."],
            ]);
        }
        
        // Register the attempt
        RateLimiter::hit($key, 60);

        return $this->realService->validateCode($code, $userId);
    }
}
