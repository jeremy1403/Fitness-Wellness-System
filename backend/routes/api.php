<?php

use App\Http\Controllers\Api\ClassScheduleController;
use App\Http\Controllers\Api\FitnessClassController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BookingController;

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

    // Module 2: Fitness Classes & Schedules
    Route::apiResource('classes', FitnessClassController::class);
    Route::get('schedules', [ClassScheduleController::class, 'index'])
        ->middleware(['provider:getAllSchedules', 'consumer'])
        ->name('schedules.index');
    Route::apiResource('schedules', ClassScheduleController::class)
        ->except(['index']);

    // Module 3: Bookings
    Route::middleware('auth:sanctum')->prefix('bookings')->group(function () {
        Route::post('/', [BookingController::class, 'store']);
        Route::get('/history', [BookingController::class, 'history']);
        Route::post('/{id}/cancel', [BookingController::class, 'cancel']);
    });
    // Route::prefix('bookings')->group(base_path('routes/api/bookings.php'));

    // Module 4: Memberships & Payments
    // Route::prefix('memberships')->group(base_path('routes/api/memberships.php'));

    // Module 5: External Health Integration & Analytics
    // Protected by Rate Limiting and HMAC Signature Verification stubs
    Route::prefix('analytics')
        ->middleware(['throttle:60,1', 'verify.hmac.stub'])
        ->group(function () {
            Route::get('/user-summary', [\App\Http\Controllers\Api\V1\AnalyticsController::class, 'getUserSummary']);
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
            'status' => $dbOk ? 'ok' : 'degraded',
            'database' => $dbOk,
            'timestamp' => now()->toIso8601String(),
        ], $dbOk ? 200 : 503);
    });
});