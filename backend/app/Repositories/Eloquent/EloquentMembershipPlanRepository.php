<?php

namespace App\Repositories\Eloquent;

use App\Models\MembershipPlan;
use App\Repositories\Contracts\MembershipPlanRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentMembershipPlanRepository implements MembershipPlanRepositoryInterface
{
    public function findById(int $id): ?MembershipPlan
    {
        return MembershipPlan::find($id);
    }

    public function findByName(string $name): ?MembershipPlan
    {
        return MembershipPlan::where('name', $name)->first();
    }

    public function all(): Collection
    {
        return MembershipPlan::all();
    }

    public function getActive(): Collection
    {
        return MembershipPlan::where('status', 'active')->get();
    }

    public function create(array $data): MembershipPlan
    {
        return MembershipPlan::create($data);
    }

    public function update(MembershipPlan $plan, array $data): MembershipPlan
    {
        $plan->update($data);
        return $plan->fresh();
    }
}
