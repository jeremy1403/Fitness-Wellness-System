<?php
namespace App\Adapters;

use App\Services\Health\ExternalHealthAdapterInterface;

class GarminWearableAdapter implements ExternalHealthAdapterInterface
{
    public function fetchStandardizedData($userId): array
    {
        // Simulate fetching messy raw JSON from Garmin APIs
        $rawPayload = '{"garmin_v2_step_count": 8432, "hr_avg_bpm": 72, "sleep_score_raw": 8.5}';
        $data = json_decode($rawPayload, true);

        // Standardize adapting into clean internal variables
        return [
            'total_steps' => $data['garmin_v2_step_count'] ?? 0,
            'heart_rate'  => $data['hr_avg_bpm'] ?? 0,
            'sleep_quality' => $data['sleep_score_raw'] ?? 0.0,
        ];
    }
}
