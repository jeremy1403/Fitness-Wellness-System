<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Contracts\PromoServiceInterface;
use App\Repositories\Contracts\PromoCodeRepositoryInterface;

class PromoCodeController extends Controller
{
    private PromoServiceInterface $promoService;
    private PromoCodeRepositoryInterface $promoRepository;

    public function __construct(
        PromoServiceInterface $promoService, 
        PromoCodeRepositoryInterface $promoRepository
    ) {
        // Here Laravel will inject the PromoCodeProxy because of our Provider binding
        $this->promoService = $promoService;
        $this->promoRepository = $promoRepository;
    }

    /**
     * Validate a promo code from a user side (with proxy rate-limiting).
     */
    public function validateCode(Request $request)
    {
        $request->validate([
            'code'    => 'required|string',
            'user_id' => 'nullable|integer',
        ]);

        $result = $this->promoService->validateCode(
            $request->input('code'),
            $request->input('user_id')
        );

        if (!$result['valid']) {
            return response()->json(['message' => $result['message']], 400);
        }

        return response()->json($result);
    }

    /**
     * Apply a validated promo code to the authenticated user's session (Cache-based).
     * Stores the code for 2 hours — consumed by Member 3/4 Checkout integration.
     */
    public function applyCode(Request $request)
    {
        $request->validate([
            'code'    => 'required|string',
            'user_id' => 'required|integer',
        ]);

        $userId = $request->input('user_id');
        $code   = strtoupper(trim($request->input('code')));

        // Validate before persisting to cache
        $result = $this->promoService->validateCode($code, $userId);

        if (!$result['valid']) {
            return response()->json(['message' => $result['message']], 400);
        }

        // Store in Cache keyed by user ID — TTL 2 hours
        \Illuminate\Support\Facades\Cache::put(
            "active_promo_{$userId}",
            [
                'code'    => $code,
                'details' => $result['details'],
            ],
            now()->addHours(2)
        );

        return response()->json([
            'message' => 'Voucher applied! It will be automatically used at checkout.',
            'code'    => $code,
            'details' => $result['details'],
        ]);
    }

    /**
     * Retrieve the currently applied promo code for a user.
     * Integration hook for Member 3/4 Checkout — GET /api/v1/promo/my-active?user_id={id}
     */
    public function getActivePromo(Request $request)
    {
        $userId = $request->query('user_id');

        if (!$userId) {
            return response()->json(['message' => 'user_id is required.'], 400);
        }

        $cached = \Illuminate\Support\Facades\Cache::get("active_promo_{$userId}");

        if (!$cached) {
            return response()->json(['active_promo' => null, 'message' => 'No active promo applied.']);
        }

        return response()->json(['active_promo' => $cached]);
    }

    /**
     * Display a sorted listing of promo codes (Admin).
     * Accepts ?sort=newest|expiring_soon|most_used
     */
    public function index(Request $request)
    {
        $sort = $request->query('sort', 'newest');
        return response()->json($this->promoRepository->getSorted($sort));
    }


    /**
     * Return publicly visible active promo codes for the member-facing Vouchers page.
     * If the user is authenticated, each promo is annotated with `is_already_used`
     * and `user_meets_tier_requirement` so the frontend can grey-out restricted vouchers.
     */
    public function available(Request $request)
    {
        // Eager-load the required plan in one query (single JOIN, not N+1)
        $promos = \App\Models\PromoCode::with('requiredPlan')->get();
        $userId = optional($request->user())->id;

        // If authenticated, pre-fetch the user's active membership plan_id
        $userPlanId = null;
        if ($userId) {
            $userPlanId = \App\Models\Membership::where('user_id', $userId)
                ->where('status', 'active')
                ->where('end_date', '>=', now())
                ->value('membership_plan_id');
        }

        $data = $promos->map(function ($promo) use ($userId, $userPlanId) {
            $arr = $promo->toArray();

            // is_already_used flag
            $arr['is_already_used'] = $userId
                ? $this->promoRepository->hasUserUsedCode($userId, $promo->id)
                : false;

            // Tier restriction metadata
            $arr['required_plan_name'] = $promo->requiredPlan?->name;
            $arr['user_meets_tier_requirement'] = $promo->required_plan_id === null
                || ($userPlanId !== null && $userPlanId == $promo->required_plan_id);

            return $arr;
        });

        return response()->json($data);
    }


    /**
     * Store a newly created promo code (Admin).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'             => 'required|string|unique:promo_codes,code',
            'discount_amount'  => 'required|numeric',
            'discount_type'    => 'nullable|string',
            'is_active'        => 'nullable|boolean',
            'max_uses'         => 'nullable|integer',
            'expires_at'       => 'nullable|date',
            'required_plan_id' => 'nullable|integer|exists:membership_plans,id',
        ]);

        $promoCode = $this->promoRepository->create($validated);
        return response()->json($promoCode, 201);
    }

    /**
     * Display the specified promo code.
     */
    public function show($id)
    {
        $promoCode = $this->promoRepository->findById($id);
        return response()->json($promoCode);
    }

    /**
     * Update the specified promo code in storage.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'code'             => 'sometimes|string|unique:promo_codes,code,' . $id,
            'discount_amount'  => 'sometimes|numeric',
            'discount_type'    => 'nullable|string',
            'is_active'        => 'nullable|boolean',
            'max_uses'         => 'nullable|integer',
            'expires_at'       => 'nullable|date',
            'required_plan_id' => 'nullable|integer|exists:membership_plans,id',
        ]);

        $promoCode = $this->promoRepository->update($id, $validated);
        return response()->json($promoCode);
    }

    /**
     * Remove the specified promo code from storage.
     */
    public function destroy($id)
    {
        $this->promoRepository->delete($id);
        return response()->json(null, 204);
    }

    /**
     * Admin: Fetch redemption history for a specific promo code.
     * Returns the pivot users with name, email, and used_at timestamp.
     */
    public function promoHistory(int $id)
    {
        $promo = $this->promoRepository->findById($id);

        $history = $promo->redeemedByUsers()->get()->map(fn($user) => [
            'user_id' => $user->id,
            'name'    => $user->name,
            'email'   => $user->email,
            'used_at' => $user->pivot->used_at,
        ]);

        return response()->json([
            'code'    => $promo->code,
            'history' => $history,
        ]);
    }

    /**
     * Admin: Quick-toggle is_active without opening the edit modal.
     */
    public function toggleActive(int $id)
    {
        $promo   = $this->promoRepository->findById($id);
        $updated = $this->promoRepository->update($id, [
            'is_active' => !$promo->is_active,
        ]);

        return response()->json([
            'message'   => 'Status toggled.',
            'is_active' => (bool) $updated->is_active,
        ]);
    }
}

