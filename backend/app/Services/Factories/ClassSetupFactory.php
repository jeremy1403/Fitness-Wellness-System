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
        // 增加这个判断，如果模式不存在或对应的类没写好，强制回滚到 Simple
        if ($mode === 'automated' && class_exists(\App\Services\Strategies\AutomatedSetupStrategy::class)) {
            return new \App\Services\Strategies\AutomatedSetupStrategy;
        }

        return new \App\Services\Strategies\SimpleSetupStrategy;
    }
}
