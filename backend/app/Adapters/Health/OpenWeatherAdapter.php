<?php

namespace App\Adapters\Health;

class OpenWeatherAdapter implements ExternalHealthAdapterInterface
{
    public function fetchData(int $userId): array
    {
        // Return Mock Weather Data
        return [
            'type' => 'weather',
            'location' => 'Los Angeles, CA',
            'temperature' => '72',
            'condition' => 'Sunny',
            'humidity' => '45%',
            'forecast' => 'Perfect day for an outdoor run!'
        ];
    }

    public function getAdapterName(): string
    {
        return 'OpenWeatherAdapter';
    }
}
