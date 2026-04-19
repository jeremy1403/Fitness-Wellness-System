<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promo_codes', function (Blueprint $table) {
            // Cap for percentage promos: "20% off, max $50"
            $table->decimal('max_discount_amount', 10, 2)->nullable()->after('discount_amount');
            // Flag for new-user-only vouchers (account age ≤ 30 days)
            $table->boolean('is_new_user_only')->default(false)->after('max_discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('promo_codes', function (Blueprint $table) {
            $table->dropColumn(['max_discount_amount', 'is_new_user_only']);
        });
    }
};
