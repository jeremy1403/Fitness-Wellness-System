<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get aggregated user summary data
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getUserSummary(Request $request): JsonResponse
    {
        // Fixed User ID for Mock implementation
        $userId = 1; 

        $summary = $this->analyticsService->getUserSummary($userId);

        return response()->json($summary);
    }
}
