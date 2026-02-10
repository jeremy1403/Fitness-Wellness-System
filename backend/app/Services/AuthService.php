<?php

namespace App\Services;

use App\DTOs\Auth\LoginData;
use App\DTOs\Auth\RegisterUserData;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Support\AppLogger;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function register(RegisterUserData $data): array
    {
        $user = $this->userRepository->create($data->toArray());

        $this->userRepository->assignRole($user, $data->role);

        $token = $user->createToken('auth-token')->plainTextToken;

        AppLogger::info('auth', 'User registered', [
            'user_id' => $user->id,
            'role' => $data->role,
        ]);

        return [
            'user' => $user->load('roles'),
            'token' => $token,
        ];
    }

    /**
     * @throws ValidationException
     */
    public function login(LoginData $data): array
    {
        $user = $this->userRepository->findByEmail($data->email);

        if (! $user || ! Hash::check($data->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been disabled. Please contact support.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        AppLogger::info('auth', 'User logged in', ['user_id' => $user->id]);

        return [
            'user' => $user->load('roles'),
            'token' => $token,
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();

        AppLogger::info('auth', 'User logged out', ['user_id' => $user->id]);
    }
}
