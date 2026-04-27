<?php

namespace App\Services\Strategies;

use App\Models\FitnessClass;
use Illuminate\Support\Facades\Log;

class SimpleSetupStrategy implements ClassSetupStrategyInterface
{
    //processing logic for the standard package.
    public function setup(FitnessClass $fitnessClass, array $data): void
    {
       
        Log::info('simple class setup trigger: '.$fitnessClass->title);

        //use duration_minutes as a fallback 
        if (empty($fitnessClass->duration_minutes)) {
            $fitnessClass->duration_minutes = 60;
            $fitnessClass->save();
        }
    }
}
