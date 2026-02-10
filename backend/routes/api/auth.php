<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Module 1: Auth & User Management Routes
|--------------------------------------------------------------------------
|
| Prefix: /api/v1/auth
|
| Public routes  — register, login
| Protected      — logout, me, profile update
| Admin-only     — user listing, status, role management
|
*/

// ── Public (guest) ──────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ── Authenticated ───────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // ── Admin-only: User management ─────────────────────────────────────
    Route::middleware('role:admin')->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/stats', [UserController::class, 'stats']);
        Route::get('/{id}', [UserController::class, 'show'])
            ->whereNumber('id');
        Route::patch('/{id}/status', [UserController::class, 'updateStatus'])
            ->whereNumber('id');
        Route::post('/{id}/roles', [UserController::class, 'assignRole'])
            ->whereNumber('id');
        Route::delete('/{id}/roles', [UserController::class, 'removeRole'])
            ->whereNumber('id');
    });
});
