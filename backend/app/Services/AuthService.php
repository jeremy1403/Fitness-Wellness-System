<?php

namespace App\Services;

use App\DTOs\Auth\ForgotPasswordData;
use App\DTOs\Auth\LoginData;
use App\DTOs\Auth\RegisterUserData;
use App\DTOs\Auth\ResetPasswordData;
use App\Models\User;
use App\Repositories\Contracts\TrainerRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Support\AppLogger;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly TrainerRepositoryInterface $trainerRepository,
    ) {}

    public function register(RegisterUserData $data): array
    {
        $user = $this->userRepository->create($data->toArray());

        $this->userRepository->assignRole($user, $data->role);

        if ($data->role === 'trainer') {
            $this->trainerRepository->create([
                'user_id' => $user->id,
                'specialty' => $data->specialty ?? 'General Fitness',
                'status' => 'active',
            ]);
        }

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

        $credentialsValid = $user && Hash::check($data->password, $user->password);

        if (! $credentialsValid) {
            if ($user && $user->isActive()) {
                $cacheKey = "login_attempts:{$user->id}";
                $attempts = Cache::increment($cacheKey);

                if ($attempts >= 5) {
                    $this->userRepository->update($user, ['status' => 'disabled']);
                    Cache::forget($cacheKey);

                    AppLogger::warning('auth', 'Account disabled due to too many failed login attempts', [
                        'user_id' => $user->id,
                        'email' => $data->email,
                    ]);

                    throw ValidationException::withMessages([
                        'email' => ['Your account has been disabled due to too many failed login attempts. Please contact support.'],
                    ]);
                }
            }

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been disabled. Please contact support.'],
            ]);
        }

        Cache::forget("login_attempts:{$user->id}");

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

    public function requestPasswordReset(ForgotPasswordData $data): string
    {
        $status = Password::broker()->sendResetLink(['email' => $data->email]);

        AppLogger::info('auth', 'Password reset requested', [
            'email' => $data->email,
            'status' => $status,
        ]);

        return $status;
    }

    public function resetPassword(ResetPasswordData $data): string
    {
        $status = Password::broker()->reset(
            $data->toArray(),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        AppLogger::info('auth', 'Password reset attempted', [
            'email' => $data->email,
            'status' => $status,
        ]);

        return $status;
    }
}
