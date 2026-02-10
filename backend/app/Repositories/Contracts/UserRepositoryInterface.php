<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    public function findById(int $id): ?User;

    public function findByEmail(string $email): ?User;

    public function create(array $data): User;

    public function update(User $user, array $data): User;

    public function all(): Collection;

    public function assignRole(User $user, string $roleName): void;

    public function removeRole(User $user, string $roleName): void;
}
