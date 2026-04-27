<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fitness_classes', function (Blueprint $table) {
            // Price for an à-la-carte (pay-per-class) booking.
            // Default 0 so existing rows remain valid without manual backfill.
            $table->decimal('price', 8, 2)->default(0)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('fitness_classes', function (Blueprint $table) {
            $table->dropColumn('price');
        });
    }
};
