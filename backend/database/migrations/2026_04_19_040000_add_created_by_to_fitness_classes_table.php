<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fitness_classes', function (Blueprint $table) {
            // Tracks which admin/trainer user created the class.
            // Nullable foreign key matches the project's existing style (nullOnDelete).
            $table->foreignId('created_by')
                  ->nullable()
                  ->after('status')
                  ->constrained('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('fitness_classes', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
        });
    }
};
