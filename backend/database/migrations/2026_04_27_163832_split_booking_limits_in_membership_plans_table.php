<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->renameColumn('booking_daily_limit', 'daily_free_quota');
            $table->integer('max_daily_bookings')->nullable()->after('booking_daily_limit');
        });

        // Seed/Update existing plans
        // Free Tier
        DB::table('membership_plans')->updateOrInsert(
            ['tier_name' => 'free', 'billing_cycle' => 'monthly'],
            [
                'price' => 0.00,
                'daily_free_quota' => 0,
                'max_daily_bookings' => 1,
                'booking_advance_days' => 1,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        // Basic Tier
        DB::table('membership_plans')->where('tier_name', 'basic')->update([
            'daily_free_quota' => 1,
            'max_daily_bookings' => 2,
        ]);

        // Premium Tier
        DB::table('membership_plans')->where('tier_name', 'premium')->update([
            'daily_free_quota' => 3,
            'max_daily_bookings' => 99,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->renameColumn('daily_free_quota', 'booking_daily_limit');
            $table->dropColumn('max_daily_bookings');
        });
    }
};
