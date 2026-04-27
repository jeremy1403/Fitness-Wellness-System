<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds three operational columns to `membership_plans`:
     *
     *  • duration_days          — fixes the checkout crash caused by this column
     *                             being absent; defaults to 30 days.
     *  • is_hidden_from_members — allows admins to hide the "Free Tier" plan from
     *                             the member-facing catalog without deleting it so
     *                             the BookingService can still reference it as a
     *                             quota fallback.
     *  • tier_level             — integer hierarchy (0 = Free, 1 = Standard,
     *                             2 = Premium) so business logic can do numeric
     *                             comparisons instead of string-matching tier names.
     */
    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->integer('duration_days')->default(30)->after('booking_advance_days');
            $table->boolean('is_hidden_from_members')->default(false)->after('status');
            $table->integer('tier_level')->default(1)->after('is_hidden_from_members');
        });

        // Back-fill sensible defaults for every existing plan.
        DB::table('membership_plans')->where('tier_name', 'free')->update([
            'is_hidden_from_members' => true,
            'tier_level'             => 0,
        ]);

        DB::table('membership_plans')->where('tier_name', 'basic')->update([
            'tier_level' => 1,
        ]);

        DB::table('membership_plans')->where('tier_name', 'premium')->update([
            'tier_level' => 2,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->dropColumn(['duration_days', 'is_hidden_from_members', 'tier_level']);
        });
    }
};
