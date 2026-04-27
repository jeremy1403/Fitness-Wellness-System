<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // membership_id must become nullable because class payments
            // are not linked to a membership subscription — they go directly
            // against a booking_id instead.
            $table->unsignedBigInteger('membership_id')->nullable()->change();

            // New FK: links a payment record to a specific class booking.
            // Nullable so that existing membership-payment rows are unaffected.
            $table->foreignId('booking_id')
                ->nullable()
                ->after('membership_id')
                ->constrained('bookings')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('booking_id');
            $table->unsignedBigInteger('membership_id')->nullable(false)->change();
        });
    }
};
