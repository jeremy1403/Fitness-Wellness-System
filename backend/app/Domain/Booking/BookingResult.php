<?php

namespace App\Domain\Booking;

use App\Models\Booking;

/**
 * BookingResult
 *
 * Immutable value object returned by BookingService::createBooking().
 *
 * Replaces the previous pattern where the service either returned a Booking
 * (success) or threw an Exception (failure). With the new quota/payment
 * decision engine, a booking creation can succeed in two distinct ways:
 *
 *   1. Quota-consumed (free class):   requiresPayment = false
 *   2. Pay-per-class (quota exceeded or Free Tier): requiresPayment = true
 *
 * The controller reads this VO and returns the appropriate HTTP response:
 *   requiresPayment = false → 201 Created  (booking is confirmed)
 *   requiresPayment = true  → 202 Accepted (booking reserved, awaiting payment)
 */
final class BookingResult
{
    public function __construct(
        public readonly ?Booking $booking,
        public readonly bool    $requiresPayment,
        public readonly ?float  $classPrice = null,
        public readonly ?int    $scheduleId = null,
    ) {}

    /**
     * Convenience factory for a quota-consumed (free) booking.
     */
    public static function quotaUsed(Booking $booking): self
    {
        return new self(
            booking:         $booking,
            requiresPayment: false,
            classPrice:      null,
            scheduleId:      $booking->class_schedule_id,
        );
    }

    /**
     * Convenience factory for a pay-per-class booking.
     *
     * @param float $classPrice The price the user must pay to confirm this booking.
     */
    public static function paymentRequired(int $scheduleId, float $classPrice): self
    {
        return new self(
            booking:         null,
            requiresPayment: true,
            classPrice:      $classPrice,
            scheduleId:      $scheduleId,
        );
    }
}
