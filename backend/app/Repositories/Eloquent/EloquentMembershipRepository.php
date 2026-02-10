<?php

namespace App\Repositories\Eloquent;

use App\Models\Membership;
use App\Repositories\Contracts\MembershipRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentMembershipRepository implements MembershipRepositoryInterface
{
    public function findById(int $id): ?Membership
    {
        return Membership::with('plan')->find($id);
    }

    public function getActiveForUser(int $userId): ?Membership
    {
        return Membership::with('plan')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->where('end_date', '>=', now()->toDateString())
            ->latest('start_date')
            ->first();
    }

    public function findByUser(int $userId): Collection
    {
        return Membership::with('plan')
            ->where('user_id', $userId)
            ->orderByDesc('start_date')
            ->get();
    }

    public function create(array $data): Membership
    {
        return Membership::create($data);
    }

    public function update(Membership $membership, array $data): Membership
    {
        $membership->update($data);

        return $membership->fresh();
    }
}
