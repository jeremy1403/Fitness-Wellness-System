<?php

namespace App\Repositories\Contracts;

use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

interface RoleRepositoryInterface
{
    public function findById(int $id): ?Role;

    public function findByName(string $name): ?Role;

    public function all(): Collection;

    public function create(array $data): Role;
}
