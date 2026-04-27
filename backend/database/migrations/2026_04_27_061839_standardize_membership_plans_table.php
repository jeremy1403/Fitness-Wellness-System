<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->string('tier_name', 50)->after('name')->nullable();
            $table->string('billing_cycle', 50)->after('tier_name')->nullable();
        });

        // Map legacy data
        $plans = DB::table('membership_plans')->get();
        foreach ($plans as $plan) {
            $name = strtolower($plan->name);
            $tier = str_contains($name, 'premium') ? 'premium' : 'basic';
            
            $cycle = 'monthly';
            if ($plan->duration_days == 180) {
                $cycle = 'biannually';
            } elseif ($plan->duration_days >= 360) {
                $cycle = 'annually';
            }
            
            DB::table('membership_plans')
                ->where('id', $plan->id)
                ->update([
                    'tier_name' => $tier,
                    'billing_cycle' => $cycle,
                ]);
        }

        // Now drop old columns
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->dropColumn(['name', 'duration_days']);
        });
    }

    public function down(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->string('name', 50)->nullable();
            $table->unsignedInteger('duration_days')->nullable();
        });

        $plans = DB::table('membership_plans')->get();
        foreach ($plans as $plan) {
            $name = ucfirst($plan->tier_name) . ' ' . ucfirst($plan->billing_cycle);
            $duration = 30;
            if ($plan->billing_cycle === 'biannually') $duration = 180;
            if ($plan->billing_cycle === 'annually') $duration = 365;

            DB::table('membership_plans')
                ->where('id', $plan->id)
                ->update([
                    'name' => $name,
                    'duration_days' => $duration,
                ]);
        }

        Schema::table('membership_plans', function (Blueprint $table) {
            $table->unique('name');
            $table->dropColumn(['tier_name', 'billing_cycle']);
        });
    }
};
