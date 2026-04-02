<?php

namespace App\Repositories\Interfaces;

use Illuminate\Support\Collection;

interface HealthInsightRepositoryInterface
{
    /**
     * Retrieve health insights for a specific user.
     *
     * @param int $userId
     * @return Collection
     */
    public function getInsightsForUser(int $userId): Collection;

    /**
     * Store a newly generated insight.
     *
     * @param array $data
     * @return mixed
     */
    public function storeInsight(array $data);
}
