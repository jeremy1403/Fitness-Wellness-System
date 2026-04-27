<?php

use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClassScheduleController;
use App\Http\Controllers\Api\FitnessClassController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PromoCodeController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api by RouteServiceProvider.
| Module routes are grouped under /v1 for API versioning.
|
*/

Route::prefix('v1')->group(function () {

    // Module 1: Auth & User Management
    Route::prefix('auth')->group(base_path('routes/api/auth.php'));
    
    // Module 2: Classes & Schedule Management
    // Apply Rate Limiting (60 requests/min) for DDoS mitigation
    Route::middleware('throttle:60,1')->group(function () {
        // CRUD api for classes
        Route::apiResource('classes', FitnessClassController::class);

        // Manage Schedules
        Route::get('schedules', [ClassScheduleController::class, 'index'])
            ->middleware(['provider:getAllSchedules', 'consumer'])
            ->name('schedules.index');

        Route::apiResource('schedules', ClassScheduleController::class)
            ->except(['index']);
        //Retrieve a list of all coaches where status active return only key information such as name and specialty.
        Route::get('trainers', function () {
            return \App\Models\Trainer::with('user')
                ->where('status', 'active')
                ->get()
                ->map(fn($t) => [
                    'id'        => $t->id,
                    'name'      => $t->user?->name ?? '',
                    'specialty' => $t->specialty,
                ]);
        });

    });

    // Module 3: Bookings — Member routes
    Route::middleware('auth:sanctum')->prefix('bookings')->group(function () {
        Route::post('/', [BookingController::class, 'store']);
        Route::get('/history', [BookingController::class, 'history']);
        Route::post('/{id}/cancel', [BookingController::class, 'cancel']);

        // Trainer + Admin: mark attendance (State Pattern)
        Route::patch('/{id}/attendance', [BookingController::class, 'updateAttendance']);

        // Trainer: get bookings for a specific schedule
        Route::get('/schedule/{scheduleId}', [BookingController::class, 'scheduleBookings']);
    });

    // Module 3: Bookings — Admin routes
    Route::middleware('auth:sanctum')->prefix('admin/bookings')->group(function () {
        Route::get('/', [BookingController::class, 'index']);
        Route::post('/{id}/cancel', [BookingController::class, 'adminCancel']);
    });

    // Module 4: Memberships & Payments
    Route::prefix('memberships')->group(base_path('routes/api/memberships.php'));

    // Module 4 (extension): Pay-Per-Class Payments
    Route::middleware('auth:sanctum')->prefix('payments')->group(function () {
        Route::post('/class', [PaymentController::class, 'processClassPayment']);
    });

    // Module 5: Promo Code & Campaign System (Proxy Pattern)
    // Public endpoint — rate limiting enforced via PromoCodeProxy service
    Route::post('/promo/validate', [PromoCodeController::class, 'validateCode']);
    // Public listing of available promos — optional auth so is_already_used is injected per user
    Route::middleware('auth:sanctum')->get('/promos/available', [PromoCodeController::class, 'available']);
    Route::get('/promos/available', [PromoCodeController::class, 'available']);
    // Apply a promo to a user's session (Cache, 2h TTL) — integration hook for Member 3/4
    Route::post('/promo/apply', [PromoCodeController::class, 'applyCode']);
    // Retrieve current applied promo — consumed by Checkout/Payment module
    Route::get('/promo/my-active', [PromoCodeController::class, 'getActivePromo']);

    // Admin CRUD — protected by admin role middleware
    Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
        Route::apiResource('promo-codes', PromoCodeController::class);
        Route::get('promo-codes/{id}/history',        [PromoCodeController::class, 'promoHistory']);
        Route::patch('promo-codes/{id}/toggle-active', [PromoCodeController::class, 'toggleActive']);
    });

    // Trainer Self-Service — scoped to trainer_id ownership (security enforced in controller)
    Route::prefix('trainer')->group(function () {
        Route::get('/promos',        [\App\Http\Controllers\Api\TrainerPromoController::class, 'index']);
        Route::post('/promos',       [\App\Http\Controllers\Api\TrainerPromoController::class, 'store']);
        Route::put('/promos/{id}',   [\App\Http\Controllers\Api\TrainerPromoController::class, 'update']);
        Route::delete('/promos/{id}',[\App\Http\Controllers\Api\TrainerPromoController::class, 'destroy']);
    });
    // Health check (includes DB connectivity)
    Route::get('/health', function () {
        $dbOk = false;

        try {
            DB::connection()->getPdo();
            $dbOk = true;
        } catch (\Exception $e) {
            // DB is down — logged by default exception handler
        }

        return response()->json([
            'status'    => $dbOk ? 'ok' : 'degraded',
            'database'  => $dbOk,
            'timestamp' => now()->toIso8601String(),
        ], $dbOk ? 200 : 503);
    });
});