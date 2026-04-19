<?php

namespace App\Adapters\Health;

class DailyHealthTipAdapter implements ExternalHealthAdapterInterface
{
    public function fetchData(int $userId): array
    {
        // Return Mock Health Tips
        return [
            'type' => 'health_tips',
            'tips' => [
                [
                    'id' => 1,
                    'category' => 'Recovery',
                    'text' => 'Remember to stretch for 15 minutes post-workout.',
                    'priority' => 'High'
                ],
                [
                    'id' => 2,
                    'category' => 'Nutrition',
                    'text' => 'Hydrate! Drink at least 8 glasses of water today.',
                    'priority' => 'Medium'
                ],
                [
                    'id' => 3,
                    'category' => 'Mindfulness',
                    'text' => 'Take 5 minutes for deep breathing exercises.',
                    'priority' => 'Low'
                ]
            ]
        ];
    }

    public function getAdapterName(): string
    {
        return 'DailyHealthTipAdapter';
    }
}
