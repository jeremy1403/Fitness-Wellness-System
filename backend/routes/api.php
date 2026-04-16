<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FitnessClassController;
use App\Http\Controllers\Api\ClassScheduleController;
//use App\Http\Controllers\Api\TrainerController;
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
    Route::apiResource('schedules', ClassScheduleController::class);
    Route::get('trainers', function() {
        return \App\Models\Trainer::with('user')
            ->where('status', 'active')
            ->get()
            ->map(fn($t) => [
                'id'        => $t->id,
                'name'      => $t->user?->name ?? '',
                'specialty' => $t->specialty,
            ]);
    });
    // Module 3: Bookings
    // Route::prefix('bookings')->group(base_path('routes/api/bookings.php'));

    // Module 4: Memberships & Payments
    Route::prefix('memberships')->group(base_path('routes/api/memberships.php'));

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
