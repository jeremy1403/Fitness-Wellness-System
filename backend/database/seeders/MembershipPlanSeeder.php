<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MembershipPlanSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('membership_plans')->insert([
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
        ]);
    }
}