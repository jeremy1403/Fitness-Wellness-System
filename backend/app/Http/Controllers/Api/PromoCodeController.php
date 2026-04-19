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
            'code' => 'required|string',
            'user_id' => 'nullable|integer'
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
     * Display a listing of promo codes (Admin).
     */
    public function index()
    {
        return response()->json($this->promoRepository->getAll());
    }

    /**
     * Store a newly created promo code (Admin).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:promo_codes,code',
            'discount_amount' => 'required|numeric',
            'discount_type' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'max_uses' => 'nullable|integer',
            'expires_at' => 'nullable|date',
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
            'code' => 'sometimes|string|unique:promo_codes,code,' . $id,
            'discount_amount' => 'sometimes|numeric',
            'discount_type' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'max_uses' => 'nullable|integer',
            'expires_at' => 'nullable|date',
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
}
