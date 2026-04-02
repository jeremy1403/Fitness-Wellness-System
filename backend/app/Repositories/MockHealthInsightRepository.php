<?php

namespace App\Repositories;

use App\Repositories\Interfaces\HealthInsightRepositoryInterface;
use Illuminate\Support\Collection;

class MockHealthInsightRepository implements HealthInsightRepositoryInterface
{
    /**
     * Retrieve mock health insights for a specific user.
     *
     * @param int $userId
     * @return Collection
     */
    public function getInsightsForUser(int $userId): Collection
    {
        // Mock Implementation for now
        return collect([
            [
                'id' => 1,
                'user_id' => $userId,
                'insight_type' => 'internal_activity',
                'data' => [
                    'activeCalories' => 450,
                    'workoutsThisWeek' => 3,
                    'nextBooking' => 'Yoga with Sarah - Tomorrow 10:00 AM'
                ],
                'generated_at' => now()->toDateTimeString(),
            ]
        ]);
    }

    /**
     * Mock store a newly generated insight.
     *
     * @param array $data
     * @return bool
     */
    public function storeInsight(array $data)
    {
        // Pretend we saved it
        return true;
    }
}
