<?php

namespace App\Services\Strategies;

use App\Models\FitnessClass;

interface ClassSetupStrategyInterface
{
    public function setup(FitnessClass $fitnessClass, array $data): void;
}
