<?php

namespace App\Services;

use App\Repositories\Interfaces\HealthInsightRepositoryInterface;
use App\Adapters\Health\OpenWeatherAdapter;
use App\Adapters\Health\DailyHealthTipAdapter;

class AnalyticsService
{
    protected HealthInsightRepositoryInterface $healthInsightRepository;

    public function __construct(HealthInsightRepositoryInterface $healthInsightRepository)
    {
        $this->healthInsightRepository = $healthInsightRepository;
    }

    /**
     * Get aggregated user summary data (Internal + External data)
     *
     * @param int $userId
     * @return array
     */
    public function getUserSummary(int $userId): array
    {
        // 1. Fetch Internal Insights (Mock Data from Repository)
        $internalInsights = $this->healthInsightRepository->getInsightsForUser($userId)->first();

        // 2. Placeholder hook for calling Member 3's booking service endpoint.
        // TODO: Consume Member 3's /api/getBookingHistory
        // $bookingHistory = Member3BookingService::getBookingHistory($userId);
        
        // 3. Fetch External Data via Adapters
        $weatherAdapter = new OpenWeatherAdapter();
        $weatherData = $weatherAdapter->fetchData($userId);

        $healthTipsAdapter = new DailyHealthTipAdapter();
        $healthTipsData = $healthTipsAdapter->fetchData($userId);

        // Combine into unified payload
        return [
            'status' => 'success',
            'data' => [
                'user_id' => $userId,
                'internalInsights' => $internalInsights['data'] ?? [],
                'externalInsights' => [
                    'weather' => $weatherData,
                    'healthTips' => $healthTipsData['tips'] ?? [],
                ]
            ]
        ];
    }
}
