<?php

namespace App\Repositories\Contracts;

use App\Models\Trainer;
use Illuminate\Database\Eloquent\Collection;

interface TrainerRepositoryInterface
{
    public function findById(int $id): ?Trainer;

    public function findByUserId(int $userId): ?Trainer;

    public function create(array $data): Trainer;

    public function update(Trainer $trainer, array $data): Trainer;

    public function all(): Collection;

    public function getActive(): Collection;
}
