<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promo_codes', function (Blueprint $table) {
            $table->string('required_tier', 50)->after('required_plan_id')->nullable();
        });

        // Map legacy data safely
        $promos = DB::table('promo_codes')->whereNotNull('required_plan_id')->get();
        foreach ($promos as $promo) {
            $plan = DB::table('membership_plans')->where('id', $promo->required_plan_id)->first();
            if ($plan) {
                // At this point, plan already has tier_name since the other migration ran first
                $tier = $plan->tier_name ?? 'basic';
                DB::table('promo_codes')
                    ->where('id', $promo->id)
                    ->update(['required_tier' => $tier]);
            }
        }

        Schema::table('promo_codes', function (Blueprint $table) {
            // Drop foreign key if exists. Using an array of column name allows Laravel to guess the FK name.
            $table->dropForeign(['required_plan_id']);
            $table->dropColumn('required_plan_id');
        });
    }

    public function down(): void
    {
        Schema::table('promo_codes', function (Blueprint $table) {
            $table->unsignedBigInteger('required_plan_id')->nullable();
            $table->foreign('required_plan_id')->references('id')->on('membership_plans')->nullOnDelete();
        });

        // Map back based on assumed plan ID for that tier (not strictly exact, but reasonable for a down migration)
        $promos = DB::table('promo_codes')->whereNotNull('required_tier')->get();
        foreach ($promos as $promo) {
            $plan = DB::table('membership_plans')->where('tier_name', $promo->required_tier)->first();
            if ($plan) {
                DB::table('promo_codes')
                    ->where('id', $promo->id)
                    ->update(['required_plan_id' => $plan->id]);
            }
        }

        Schema::table('promo_codes', function (Blueprint $table) {
            $table->dropColumn('required_tier');
        });
    }
};
