<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Repositories\Contracts\PromoCodeRepositoryInterface;
use App\Models\User;

/**
 * Trainer Self-Service Promo Controller
 *
 * Security Model:
 *   - All routes require auth:sanctum + the caller must have the 'trainer' role.
 *   - Trainers can ONLY view/modify codes where trainer_id = their own user_id.
 *   - This is enforced at the repository layer (getByTrainer) AND with an
 *     ownership check in update/delete (ownershipGuard).
 */
class TrainerPromoController extends Controller
{
    private PromoCodeRepositoryInterface $promoRepository;

    public function __construct(PromoCodeRepositoryInterface $promoRepository)
    {
        $this->promoRepository = $promoRepository;
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private function resolveTrainer(Request $request): User
    {
        // In production: use Auth::user() via sanctum token
        // For demo/testing we accept user_id query param
        $userId = $request->input('user_id') ?? $request->query('user_id');
        $user   = User::find($userId);

        if (!$user || !$user->hasRole('trainer')) {
            abort(403, 'Access denied. This endpoint is for trainers only.');
        }

        return $user;
    }

    private function ownershipGuard(User $trainer, int $promoCodeId): \App\Models\PromoCode
    {
        $promo = $this->promoRepository->findById($promoCodeId);

        if ((int) $promo->trainer_id !== (int) $trainer->id) {
            abort(403, 'You do not have permission to manage this promo code.');
        }

        return $promo;
    }

    // ── Endpoints ────────────────────────────────────────────────────────

    /**
     * GET /api/v1/trainer/promos?user_id={id}
     * List only THIS trainer's codes + KPI metrics.
     */
    public function index(Request $request)
    {
        $trainer = $this->resolveTrainer($request);
        $codes   = $this->promoRepository->getByTrainer($trainer->id);

        $totalRedemptions = $codes->sum('times_used');
        $totalSavings     = $codes->sum(fn($c) =>
            $c->discount_type === 'fixed'
                ? $c->discount_amount * $c->times_used
                : 0  // percentage savings would need cart context; we report fixed savings
        );
        $kpiScore         = $totalRedemptions * 10; // 10 KPI points per redemption

        return response()->json([
            'codes' => $codes,
            'kpi'   => [
                'total_redemptions' => $totalRedemptions,
                'total_savings'     => round($totalSavings, 2),
                'kpi_score'         => $kpiScore,
                'kpi_tier'          => $this->kpiTier($kpiScore),
            ],
        ]);
    }

    /**
     * POST /api/v1/trainer/promos
     * Trainer creates their own referral code — trainer_id auto-set.
     *
     * Trainer Constraints (Privilege Escalation Prevention):
     *  - Percentage discount: max 20%
     *  - Fixed discount: max RM 50
     */
    public function store(Request $request)
    {
        $trainer = $this->resolveTrainer($request);

        $validated = $request->validate([
            'code'                => 'required|string|unique:promo_codes,code|max:32',
            'discount_type'       => 'required|in:fixed,percentage',
            'discount_amount'     => 'required|numeric|min:0.01',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'max_uses'            => 'nullable|integer|min:1',
            'expires_at'          => 'nullable|date|after:today',
            'is_new_user_only'    => 'boolean',
            'required_plan_id'    => 'nullable|integer|exists:membership_plans,id',
        ]);

        // ── Trainer Discount Cap (Privilege Escalation Prevention) ────────────
        $type   = $validated['discount_type'];
        $amount = (float) $validated['discount_amount'];

        if ($type === 'percentage' && $amount > 20) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_amount' => ['Trainers can only offer up to 20% discount. Please enter a value between 0.01 and 20.'],
            ]);
        }

        if ($type === 'fixed' && $amount > 50) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_amount' => ['Trainers can only offer up to RM 50 fixed discount. Please enter a value between 0.01 and 50.'],
            ]);
        }

        $validated['trainer_id'] = $trainer->id;
        $validated['is_active']  = true;
        $validated['times_used'] = 0;
        $validated['code']       = strtoupper($validated['code']);

        $promo = $this->promoRepository->create($validated);

        return response()->json($promo, 201);
    }

    /**
     * PUT /api/v1/trainer/promos/{id}
     * Trainer edits their own code only.
     */
    public function update(Request $request, int $id)
    {
        $trainer = $this->resolveTrainer($request);
        $promo   = $this->ownershipGuard($trainer, $id);

        $validated = $request->validate([
            'discount_type'       => 'sometimes|in:fixed,percentage',
            'discount_amount'     => 'sometimes|numeric|min:0.01',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'max_uses'            => 'nullable|integer|min:1',
            'expires_at'          => 'nullable|date|after:today',
            'is_active'           => 'sometimes|boolean',
            'is_new_user_only'    => 'sometimes|boolean',
            'required_plan_id'    => 'nullable|integer|exists:membership_plans,id',
        ]);

        // ── Trainer Discount Cap — also enforced on updates ───────────────────
        $type   = $validated['discount_type'] ?? $promo->discount_type;
        $amount = isset($validated['discount_amount'])
            ? (float) $validated['discount_amount']
            : (float) $promo->discount_amount;

        if ($type === 'percentage' && $amount > 20) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_amount' => ['Trainers can only offer up to 20% discount. Please enter a value between 0.01 and 20.'],
            ]);
        }

        if ($type === 'fixed' && $amount > 50) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_amount' => ['Trainers can only offer up to RM 50 fixed discount. Please enter a value between 0.01 and 50.'],
            ]);
        }

        $promo->update($validated);

        return response()->json($promo);
    }


    /**
     * DELETE /api/v1/trainer/promos/{id}
     * Trainer deletes their own code only.
     */
    public function destroy(Request $request, int $id)
    {
        $trainer = $this->resolveTrainer($request);
        $this->ownershipGuard($trainer, $id);
        $this->promoRepository->delete($id);

        return response()->json(null, 204);
    }

    // ── KPI Tier Logic ───────────────────────────────────────────────────

    private function kpiTier(int $score): array
    {
        if ($score >= 500) return ['label' => 'Elite',   'color' => 'amber',  'next_at' => null,  'progress' => 100];
        if ($score >= 200) return ['label' => 'Gold',    'color' => 'yellow', 'next_at' => 500,   'progress' => (int)(($score - 200) / 3)];
        if ($score >= 100) return ['label' => 'Silver',  'color' => 'slate',  'next_at' => 200,   'progress' => (int)(($score - 100))];
        if ($score >= 30)  return ['label' => 'Bronze',  'color' => 'orange', 'next_at' => 100,   'progress' => (int)(($score - 30) * 1.43)];
        return              ['label' => 'Starter', 'color' => 'teal',   'next_at' => 30,    'progress' => (int)($score * 3.33)];
    }
}
