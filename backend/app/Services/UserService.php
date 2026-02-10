<?php

namespace App\Services;

use App\DTOs\Auth\UpdateProfileData;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Support\AppLogger;

class UserService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function getAllUsers(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->userRepository->all();
    }

    public function getUserById(int $id): ?User
    {
        return $this->userRepository->findById($id);
    }

    public function getStatusCounts(): array
    {
        $users = $this->userRepository->all();

        return [
            'active' => $users->where('status', 'active')->count(),
            'disabled' => $users->where('status', 'disabled')->count(),
            'total' => $users->count(),
        ];
    }

    public function updateProfile(User $user, UpdateProfileData $data): User
    {
        $updated = $this->userRepository->update($user, $data->toArray());

        AppLogger::info('auth', 'Profile updated', ['user_id' => $user->id]);

        return $updated->load('roles');
    }

    public function updateStatus(User $user, string $status): User
    {
        $updated = $this->userRepository->update($user, ['status' => $status]);

        AppLogger::info('auth', 'User status changed', [
            'user_id' => $user->id,
            'status' => $status,
        ]);

        return $updated;
    }

    public function assignRole(User $user, string $roleName): void
    {
        $this->userRepository->assignRole($user, $roleName);

        AppLogger::info('auth', 'Role assigned', [
            'user_id' => $user->id,
            'role' => $roleName,
        ]);
    }

    public function removeRole(User $user, string $roleName): void
    {
        $this->userRepository->removeRole($user, $roleName);

        AppLogger::info('auth', 'Role removed', [
            'user_id' => $user->id,
            'role' => $roleName,
        ]);
    }
}
