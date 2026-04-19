<?php

namespace App\Services\Promo;

use App\Models\PromoCode;
use App\Models\User;
use App\Services\Contracts\PromoServiceInterface;
use App\Repositories\Contracts\PromoCodeRepositoryInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class RealPromoService implements PromoServiceInterface
{
    private PromoCodeRepositoryInterface $promoRepository;

    public function __construct(PromoCodeRepositoryInterface $promoRepository)
    {
        $this->promoRepository = $promoRepository;
    }

    /**
     * Validates the promo code with full business rule checks.
     * SQL Injection prevention: all DB queries use Eloquent parameterized queries via the repository.
     */
    public function validateCode(string $code, ?int $userId = null): array
    {
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

        // ── Advanced Rule 1: New-User-Only Check ────────────────────────────
        if ($promo->is_new_user_only) {
            $user = $userId ? User::find($userId) : Auth::user();
            if (!$user || !$this->isNewUser($user)) {
                return ['valid' => false, 'message' => 'This voucher is for new users only (accounts created within the last 30 days).'];
            }
        }

        // ── Advanced Rule 2: Per-User Usage Limit ───────────────────────────
        if ($userId) {
            $alreadyUsed = $this->promoRepository->hasUserUsedCode($userId, $promo->id);
            if ($alreadyUsed) {
                return ['valid' => false, 'message' => 'You have already used this promo code.'];
            }
        }

        // ── Advanced Rule 3: Max Cap Calculation for Percentage Promos ──────
        $discountAmount = (float) $promo->discount_amount;
        $cappedAt = null;

        if ($promo->discount_type === 'percentage' && $promo->max_discount_amount !== null) {
            // This is computed on the backend for integrity; the cart total would come from the request in a full integration
            $cappedAt = (float) $promo->max_discount_amount;
        }

        return [
            'valid'   => true,
            'message' => 'Promo code applied successfully!',
            'details' => [
                'discount_type'       => $promo->discount_type,
                'discount_amount'     => $discountAmount,
                'max_discount_amount' => $cappedAt,
                'is_new_user_only'    => $promo->is_new_user_only,
                'promo_code_id'       => $promo->id,
            ],
        ];
    }

    /**
     * Checks whether the user account was created within the last 30 days.
     * This replaces the previous isNewUserRequired() / checkIfNewUser() placeholder pair.
     */
    private function isNewUser(User $user): bool
    {
        return $user->created_at->greaterThan(Carbon::now()->subDays(30));
    }

    // ── NOTE: Consuming Member 1's User Access API ──────────────────────────
    // The isNewUser() method above uses the local User model for now.
    // When Member 1 exposes their microservice, this check can be replaced with:
    //
    //   $response = Http::withToken($internalToken)
    //       ->get("http://user-service/api/v1/users/{$userId}/is-new");
    //   return $response->successful() && $response->json('is_new') === true;
    //
    // The method signature stays the same — zero changes to callers.
}
