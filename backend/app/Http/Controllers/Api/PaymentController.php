<?php
namespace App\Http\Controllers\Api;

use App\DTOs\Membership\ProcessPaymentData;
use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    // GET /api/v1/payments/my
    // Returns current user's payment history
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

    // GET /api/v1/payments/{id}
    // Returns a single payment (receipt)
    public function show(Request $request, int $id): JsonResponse
    {
        $payment = $this->paymentService->getPaymentById($id);

        // Make sure user can only see their own payments
        if ($payment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json([
            'message' => 'Payment retrieved.',
            'data'    => $payment,
        ]);
    }

    // POST /api/v1/payments/process
    // Process a payment for a membership
    public function process(Request $request): JsonResponse
    {
        $request->validate([
            'membership_id' => 'required|integer|exists:memberships,id',
            'amount'        => 'required|numeric|min:0',
            'method'        => 'required|string|in:cash,transfer,card_mock',
        ]);

        $payment = $this->paymentService->processPayment(
            new ProcessPaymentData(
                userId:       $request->user()->id,
                membershipId: $request->membership_id,
                amount:       $request->amount,
                method:       $request->method,
            )
        );

        return response()->json([
            'message' => 'Payment processed successfully.',
            'data'    => $payment,
        ], 201);
    }

    // GET /api/v1/payments/membership/{id}
    // Returns all payments for a specific membership
    public function byMembership(int $id): JsonResponse
    {
        $payments = $this->paymentService->getMembershipPayments($id);
        return response()->json([
            'message' => 'Membership payments retrieved.',
            'data'    => $payments,
        ]);
    }
}