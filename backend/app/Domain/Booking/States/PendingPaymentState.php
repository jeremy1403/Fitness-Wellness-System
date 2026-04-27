<?php

namespace App\Domain\Booking\States;

use Exception;

/**
 * PendingPaymentState
 *
 * A booking enters this state when the user has exhausted their daily
 * free-class quota (or has no membership at all) and the class requires
 * payment before being confirmed.
 *
 * Valid transitions:
 *   pending_payment → cancelled    (user cancels before paying)
 *
 * BLOCKED transitions (must pay first):
 *   pending_payment → attended     ❌
 *   pending_payment → no_show      ❌
 *
 * The transition to 'confirmed' is NOT handled here — it is performed
 * atomically inside PaymentService::processClassPayment() within a DB
 * transaction when the payment is successfully recorded.
 */
class PendingPaymentState implements BookingStateInterface
{
    public function cancel(): string
    {
        return 'cancelled';
    }

    public function markAttended(): string
    {
        throw new Exception('Cannot mark attendance on a booking that is pending payment. The user must complete payment first.');
    }

    public function markNoShow(): string
    {
        throw new Exception('Cannot mark no-show on a booking that is pending payment. The user must complete payment first.');
    }
}
