<?php

namespace App\Repositories\Eloquent;

use App\Models\FitnessClass;
use App\Repositories\Contracts\FitnessClassRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentFitnessClassRepository implements FitnessClassRepositoryInterface
{
    public function findById(int $id): ?FitnessClass
    {
        return FitnessClass::find($id);
    }

    public function create(array $data): FitnessClass
    {
        return FitnessClass::create($data);
    }

    public function update(FitnessClass $fitnessClass, array $data): FitnessClass
    {
        $fitnessClass->update($data);

        return $fitnessClass->fresh();
    }

    public function delete(FitnessClass $fitnessClass): bool
    {
        return $fitnessClass->delete();
    }

    public function all(): Collection
    {
        // return FitnessClass::all();
        return FitnessClass::orderByDesc('created_at')->get();
    }

    public function getActive(): Collection
    {
        return FitnessClass::where('status', 'active')->get();
    }
}
