<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promo_codes', function (Blueprint $table) {
            // Tier-restriction: if set, the user must hold THIS plan to redeem the promo.
            // Nullable FK — null means "open to all membership tiers".
            $table->unsignedBigInteger('required_plan_id')
                  ->nullable()
                  ->after('trainer_id');

            $table->foreign('required_plan_id')
                  ->references('id')
                  ->on('membership_plans')
                  ->nullOnDelete(); // if the plan is deleted, restriction is lifted
        });
    }

    public function down(): void
    {
        Schema::table('promo_codes', function (Blueprint $table) {
            $table->dropForeign(['required_plan_id']);
            $table->dropColumn('required_plan_id');
        });
    }
};
