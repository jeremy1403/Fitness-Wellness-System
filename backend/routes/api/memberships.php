<?php

use App\Http\Controllers\Api\MembershipController;
use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;

// All routes here require the user to be logged in
Route::middleware('auth:sanctum')->group(function () {

    // --- Membership Routes ---

    // Get all active plans (members browse)
    Route::get('/plans', [MembershipController::class, 'getPlans']);

    // Get current user's active membership
    Route::get('/my', [MembershipController::class, 'myMembership']);

    // Get current user's membership history
    Route::get('/history', [MembershipController::class, 'myHistory']);

    // Subscribe to a plan
    Route::post('/subscribe', [MembershipController::class, 'subscribe']);

    // Cancel a membership
    Route::put('/{id}/cancel', [MembershipController::class, 'cancel']);

    // Get subscription status (exposed for other modules)
    Route::get('/status', [MembershipController::class, 'getSubscriptionStatus']);

    // --- Payment Routes ---

    // Get current user's payment history
    Route::get('/payments/my', [PaymentController::class, 'myPayments']);

    // Get a single payment by ID (receipt)
    Route::get('/payments/{id}', [PaymentController::class, 'show']);

    // Process a payment
    Route::post('/payments/process', [PaymentController::class, 'process']);

    // Get payments for a specific membership
    Route::get('/payments/membership/{id}', [PaymentController::class, 'byMembership']);

    // --- Admin Only Routes ---
    Route::middleware('role:admin')->group(function () {

        // Get all plans including inactive (admin view)
        Route::get('/plans/all', [MembershipController::class, 'getAllPlans']);

        // Update membership status
        Route::put('/{id}/status', [MembershipController::class, 'updateStatus']);

        // Admin - get all payments
        Route::get('/payments/all', [PaymentController::class, 'allPayments']);

        // Update plan status
        Route::put('/plans/{id}/status', [MembershipController::class, 'updatePlanStatus']);
    });
});
