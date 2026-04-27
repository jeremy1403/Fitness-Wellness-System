<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Tracks whether this booking consumed a daily free-quota slot.
            // false → the user needs to (or already did) pay for this class.
            $table->boolean('is_quota_used')->default(false)->after('cancelled_at');

            // Expand the status column to accommodate the new payment-aware states.
            // Existing 'booked' rows are kept intentionally; the State Factory
            // maps 'booked' → BookedState as a legacy alias.
            // New bookings will only ever get 'confirmed' or 'pending_payment'.
            $table->string('status', 30)->default('confirmed')->change();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('is_quota_used');
            $table->string('status', 20)->default('booked')->change();
        });
    }
};
