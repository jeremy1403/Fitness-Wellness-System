<?php

namespace App\Repositories\Contracts;

use App\Models\MembershipPlan;
use Illuminate\Database\Eloquent\Collection;

interface MembershipPlanRepositoryInterface
{
    public function findById(int $id): ?MembershipPlan;

    public function findByName(string $name): ?MembershipPlan;

    public function all(): Collection;

    public function getActive(): Collection;
}
