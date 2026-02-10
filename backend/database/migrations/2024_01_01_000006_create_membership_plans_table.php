<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->decimal('price', 10, 2);
            $table->unsignedInteger('duration_days');
            $table->unsignedInteger('booking_daily_limit');
            $table->unsignedInteger('booking_advance_days');
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_plans');
    }
};
