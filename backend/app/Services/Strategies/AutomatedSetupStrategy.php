<?php

namespace App\Services\Strategies;

use App\Models\ClassSchedule;
use App\Models\FitnessClass;

class AutomatedSetupStrategy implements ClassSetupStrategyInterface
{
    public function setup(FitnessClass $fitnessClass, array $data): void
    {
        // 1. 定义配置映射
        $configs = [
            'Yoga' => ['duration' => 60, 'capacity' => 15],
            'Spin' => ['duration' => 45, 'capacity' => 20],
            'HIIT' => ['duration' => 30, 'capacity' => 12],
        ];

        $type = $data['class_type'] ?? 'General';
        $config = $configs[$type] ?? ['duration' => 60, 'capacity' => 20];

        // 2. 【重要】更新主表的时长，因为你的 Migration 里有这个字段
        $fitnessClass->update([
            'duration_minutes' => $config['duration'],
        ]);

        // 3. 自动创建课表 (Schedules)
        ClassSchedule::create([
            'fitness_class_id' => $fitnessClass->id,
            'start_time' => now()->addDay()->setTime(10, 0),
            'end_time' => now()->addDay()->setTime(10, 0)->addMinutes($config['duration']),
            'capacity' => $config['capacity'],
        ]);
    }
}
