<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    private function canModifyRole(User $actor, User $target): Response
    {
        if ($target->id === 1) {
            return Response::deny("Cannot modify the default admin's role.");
        }

        if ($actor->id !== 1 && $target->hasRole('admin')) {
            return Response::deny("Cannot modify another admin's role.");
        }

        return Response::allow();
    }

    public function assignRole(User $actor, User $target): Response
    {
        return $this->canModifyRole($actor, $target);
    }

    public function removeRole(User $actor, User $target): Response
    {
        return $this->canModifyRole($actor, $target);
    }
}
