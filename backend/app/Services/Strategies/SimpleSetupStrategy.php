<?php

namespace App\Services\Strategies;

use App\Models\FitnessClass;
use Illuminate\Support\Facades\Log;

class SimpleSetupStrategy implements ClassSetupStrategyInterface
{
    /**
     * 这里就是“普通套餐”的处理逻辑
     */
    public function setup(FitnessClass $fitnessClass, array $data): void
    {
        // 如果目前没啥特殊逻辑，先留个日志，保证程序不报错
        Log::info("simple class setup trigger: " . $fitnessClass->title);
        
        // 既然你不想改 Migration，我们可以在这里兜底 duration_minutes
        if (empty($fitnessClass->duration_minutes)) {
            $fitnessClass->duration_minutes = 60;
            $fitnessClass->save();
        }
    }
}