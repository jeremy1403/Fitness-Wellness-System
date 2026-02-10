<?php

namespace App\Repositories\Contracts;

use App\Models\Membership;
use Illuminate\Database\Eloquent\Collection;

interface MembershipRepositoryInterface
{
    public function findById(int $id): ?Membership;

    public function getActiveForUser(int $userId): ?Membership;

    public function findByUser(int $userId): Collection;

    public function create(array $data): Membership;

    public function update(Membership $membership, array $data): Membership;
}
