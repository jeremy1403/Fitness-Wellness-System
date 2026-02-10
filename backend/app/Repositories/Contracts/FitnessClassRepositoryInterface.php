<?php

namespace App\Repositories\Contracts;

use App\Models\FitnessClass;
use Illuminate\Database\Eloquent\Collection;

interface FitnessClassRepositoryInterface
{
    public function findById(int $id): ?FitnessClass;

    public function create(array $data): FitnessClass;

    public function update(FitnessClass $fitnessClass, array $data): FitnessClass;

    public function delete(FitnessClass $fitnessClass): bool;

    public function all(): Collection;

    public function getActive(): Collection;
}
