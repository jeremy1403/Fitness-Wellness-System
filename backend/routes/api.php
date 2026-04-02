<?php

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

    // Module 2: Fitness Classes & Schedules
    // Route::prefix('classes')->group(base_path('routes/api/classes.php'));

    // Module 3: Bookings
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
