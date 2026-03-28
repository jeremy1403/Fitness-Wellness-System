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
    // Route::prefix('classes')->group(base_path('routes/api/classes.php'));
    Route::apiResource('classes', FitnessClassController::class);
    Route::prefix('v1')->group(function () {
        // 排课 CRUD
        Route::apiResource('schedules', ClassScheduleController::class);
        
        // 教练列表 (用于前端下拉框)
        Route::get('trainers', function() {
            return \App\Models\Trainer::with('user')->get();
        });
    });
    // Module 3: Bookings
    // Route::prefix('bookings')->group(base_path('routes/api/bookings.php'));

    // Module 4: Memberships & Payments
    // Route::prefix('memberships')->group(base_path('routes/api/memberships.php'));

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
