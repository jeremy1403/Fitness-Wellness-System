<?php

namespace App\Repositories\Eloquent;

use App\Models\Trainer;
use App\Repositories\Contracts\TrainerRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentTrainerRepository implements TrainerRepositoryInterface
{
    public function findById(int $id): ?Trainer
    {
        return Trainer::find($id);
    }

    public function findByUserId(int $userId): ?Trainer
    {
        return Trainer::where('user_id', $userId)->first();
    }

    public function create(array $data): Trainer
    {
        return Trainer::create($data);
    }

    public function update(Trainer $trainer, array $data): Trainer
    {
        $trainer->update($data);

        return $trainer->fresh();
    }

    public function all(): Collection
    {
        return Trainer::with('user')->get();
    }

    public function getActive(): Collection
    {
        return Trainer::with('user')->where('status', 'active')->get();
    }
}
