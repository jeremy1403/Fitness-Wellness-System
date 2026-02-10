<?php

namespace App\Http\Controllers\Api;

use App\DTOs\Auth\LoginData;
use App\DTOs\Auth\RegisterUserData;
use App\DTOs\Auth\UpdateProfileData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly UserService $userService,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = RegisterUserData::fromArray($request->validated());

        $result = $this->authService->register($data);

        return response()->json([
            'message' => 'Registration successful.',
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = LoginData::fromArray($request->validated());

        $result = $this->authService->login($data);

        return response()->json([
            'message' => 'Login successful.',
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $data = UpdateProfileData::fromArray($request->validated());

        $user = $this->userService->updateProfile($request->user(), $data);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => new UserResource($user),
        ]);
    }
}
