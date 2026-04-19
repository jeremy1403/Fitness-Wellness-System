<?php

use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClassScheduleController;
use App\Http\Controllers\Api\FitnessClassController;
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
    Route::apiResource('classes', FitnessClassController::class);
    Route::get('schedules', [ClassScheduleController::class, 'index'])
        ->middleware(['provider:getAllSchedules', 'consumer'])
        ->name('schedules.index');
    Route::apiResource('schedules', ClassScheduleController::class)
        ->except(['index']);

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
            'status'    => $dbOk ? 'ok' : 'degraded',
            'database'  => $dbOk,
            'timestamp' => now()->toIso8601String(),
        ], $dbOk ? 200 : 503);
    });
});