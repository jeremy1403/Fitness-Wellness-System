<?php

namespace App\Repositories\Eloquent;

use App\Models\Role;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentUserRepository implements UserRepositoryInterface
{
    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);

        return $user->fresh();
    }

    public function all(): Collection
    {
        return User::all();
    }

    public function assignRole(User $user, string $roleName): void
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        $user->roles()->syncWithoutDetaching([$role->id]);
    }

    public function removeRole(User $user, string $roleName): void
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        $user->roles()->detach($role->id);
    }
}
