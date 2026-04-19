<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MembershipPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'                 => 'Basic',
                'price'                => 29.99,
                'duration_days'        => 30,
                'booking_daily_limit'  => 1,
                'booking_advance_days' => 3,
                'status'               => 'active',
                'created_at'           => now(),
                'updated_at'           => now(),
            ],
            [
                'name'                 => 'Premium',
                'price'                => 79.99,
                'duration_days'        => 30,
                'booking_daily_limit'  => 3,
                'booking_advance_days' => 14,
                'status'               => 'active',
                'created_at'           => now(),
                'updated_at'           => now(),
            ],
            [
                'name'                 => 'Annual Basic',
                'price'                => 299.99,
                'duration_days'        => 365,
                'booking_daily_limit'  => 1,
                'booking_advance_days' => 3,
                'status'               => 'active',
                'created_at'           => now(),
                'updated_at'           => now(),
            ],
            [
                'name'                 => 'Annual Premium',
                'price'                => 799.99,
                'duration_days'        => 365,
                'booking_daily_limit'  => 3,
                'booking_advance_days' => 14,
                'status'               => 'active',
                'created_at'           => now(),
                'updated_at'           => now(),
            ],
        ];

        // upsert checks if name already exists
        // if it does → updates it
        // if it doesn't → inserts it
        // this way running the seeder multiple times won't cause errors
        DB::table('membership_plans')->upsert(
            $plans,
            ['name'],
            ['price', 'duration_days', 'booking_daily_limit', 'booking_advance_days', 'status', 'updated_at']
        );
    }
}