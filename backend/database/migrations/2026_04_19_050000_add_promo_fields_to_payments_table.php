<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Links the payment to the promo code that was applied.
            // Nullable — most payments have no promo.
            // nullOnDelete: if a promo code is deleted, historical payments are preserved.
            $table->foreignId('promo_code_id')
                  ->nullable()
                  ->after('reference_no')
                  ->constrained('promo_codes')
                  ->nullOnDelete();

            // The monetary discount amount that was subtracted from the original price.
            // Stored explicitly so payment history is self-contained even if promo is later deleted.
            $table->decimal('discount_applied', 10, 2)
                  ->default(0.00)
                  ->after('promo_code_id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['promo_code_id']);
            $table->dropColumn(['promo_code_id', 'discount_applied']);
        });
    }
};
