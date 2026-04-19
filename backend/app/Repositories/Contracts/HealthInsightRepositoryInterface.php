<?php
namespace App\Repositories\Contracts;

interface HealthInsightRepositoryInterface
{
    public function saveInsight(array $data);
    public function logSync(array $data);
    public function getLatestInsight(int $userId);
    public function saveActivityMetrics(int $userId, array $metrics);
}
