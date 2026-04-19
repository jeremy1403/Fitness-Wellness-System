<?php

namespace App\Http\Controllers\Api;

use App\DTOs\Membership\ProcessPaymentData;
use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Payment;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function myPayments(Request $request): JsonResponse
    {
        $payments = $this->paymentService->getUserPayments(
            $request->user()->id
        );

        return response()->json([
            'message' => 'Payment history retrieved.',
            'data'    => $payments,
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $payment = $this->paymentService->getPaymentById((int) $id);

        if ($payment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json([
            'message' => 'Payment retrieved.',
            'data'    => $payment,
        ]);
    }

    public function process(Request $request): JsonResponse
    {
        $request->validate([
            'membership_id' => 'required|integer|exists:memberships,id',
            'amount'        => 'required|numeric|min:0',
            'method'        => 'required|string|in:cash,transfer,card_mock',
            'promo_code'    => 'nullable|string|max:50',
        ]);

        $payment = $this->paymentService->processPayment(
            new ProcessPaymentData(
                userId:       $request->user()->id,
                membershipId: $request->membership_id,
                amount:       $request->amount,
                method:       $request->method,
                promoCode:    $request->promo_code ? strtoupper(trim($request->promo_code)) : null,
            )
        );

        return response()->json([
            'message' => $payment->status === 'pending'
                ? 'Cash payment recorded. Awaiting admin confirmation.'
                : 'Payment processed successfully.',
            'data'    => $payment,
        ], 201);
    }

    public function byMembership(int $id): JsonResponse
    {
        $payments = $this->paymentService->getMembershipPayments($id);

        return response()->json([
            'message' => 'Membership payments retrieved.',
            'data'    => $payments,
        ]);
    }

    public function allPayments(): JsonResponse
    {
        $payments = Payment::with('membership.plan', 'user')
            ->orderByDesc('paid_at')
            ->get();

        return response()->json([
            'message' => 'All payments retrieved.',
            'data'    => $payments,
        ]);
    }

    public function markAsPaid(string $id): JsonResponse
    {
        $payment = $this->paymentService->markAsPaid((int) $id);

        return response()->json([
            'message' => 'Payment marked as paid successfully.',
            'data'    => $payment,
        ]);
    }
}