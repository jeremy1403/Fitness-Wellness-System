<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fitness_class_id')->constrained('fitness_classes')->cascadeOnDelete();
            $table->foreignId('trainer_id')->constrained()->cascadeOnDelete();
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->unsignedInteger('capacity');
            $table->string('status', 20)->default('open');
            $table->timestamps();

            $table->index(['start_datetime', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_schedules');
    }
};
