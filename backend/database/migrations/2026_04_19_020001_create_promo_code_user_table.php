<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promo_code_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('promo_code_id')->constrained()->onDelete('cascade');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            // Prevent a user redeeming the same code more than once
            $table->unique(['user_id', 'promo_code_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_code_user');
    }
};
