<?php

namespace App\Services\Factories;

use App\Services\Strategies\AutomatedSetupStrategy;
use App\Services\Strategies\ClassSetupStrategyInterface;
use App\Services\Strategies\SimpleSetupStrategy;
use InvalidArgumentException;

class ClassSetupFactory
{
    /**
     * 根据类型返回对应的策略实例
     */
    // public static function make(string $type): ClassSetupStrategyInterface
    // {
    //     return match ($type) {
    //         'simple' => new SimpleSetupStrategy(),
    //         'automated' => new AutomatedSetupStrategy(),
    //         default => throw new InvalidArgumentException("不支持的安装类型: {$type}"),
    //     };
    // }
    public static function make(string $mode): ClassSetupStrategyInterface
    {
        // If the pattern does not exist or the corresponding class is not properly defined, force a rollback to Simple.
        if ($mode === 'automated' && class_exists(\App\Services\Strategies\AutomatedSetupStrategy::class)) {
            return new \App\Services\Strategies\AutomatedSetupStrategy;
        }

        return new \App\Services\Strategies\SimpleSetupStrategy;
    }
}
