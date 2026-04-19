<?php

namespace App\Services\Promo;

use App\Models\PromoCode;
use App\Services\Contracts\PromoServiceInterface;
use App\Repositories\Contracts\PromoCodeRepositoryInterface;
use Illuminate\Support\Carbon;

class RealPromoService implements PromoServiceInterface
{
    private PromoCodeRepositoryInterface $promoRepository;

    public function __construct(PromoCodeRepositoryInterface $promoRepository)
    {
        $this->promoRepository = $promoRepository;
    }

    /**
     * Validates the promo code directly against the database logic.
     */
    public function validateCode(string $code, ?int $userId = null): array
    {
        // SQL Injection prevention via repository which uses Eloquent parameterized queries
        $promo = $this->promoRepository->findByCode($code);

        if (!$promo) {
            return ['valid' => false, 'message' => 'Promo code not found.'];
        }

        if (!$promo->is_active) {
            return ['valid' => false, 'message' => 'Promo code is inactive.'];
        }

        if ($promo->expires_at && Carbon::now()->greaterThan($promo->expires_at)) {
            return ['valid' => false, 'message' => 'Promo code has expired.'];
        }

        if ($promo->max_uses !== null && $promo->times_used >= $promo->max_uses) {
            return ['valid' => false, 'message' => 'Promo code usage limit reached.'];
        }

        // Consume placeholder logic: Determine if the code applies to specific user conditions
        // Example: Only apply new user discount
        if ($this->isNewUserRequired($promo->code) && !$this->checkIfNewUser($userId)) {
            return ['valid' => false, 'message' => 'This promo code is only valid for new users.'];
        }

        return [
            'valid' => true,
            'message' => 'Promo code applied successfully!',
            'details' => [
                'discount_type' => $promo->discount_type,
                'discount_amount' => $promo->discount_amount,
            ]
        ];
    }

    private function isNewUserRequired(string $code): bool
    {
        return str_starts_with(strtoupper($code), 'NEW');
    }

    private function checkIfNewUser(?int $userId): bool
    {
        // Placeholder for consuming Member 1's (User Access) API
        // if (!$userId) return false;
        // $response = Http::get("http://internal-user-api/users/{$userId}/is-new");
        // return $response->json('is_new');
        return true; 
    }
}
