<?php

namespace App\Domain\Booking\States;

use Exception;

/**
 * ConfirmedState
 *
 * A booking enters this state when:
 *   (a) the user had a free daily quota slot available and it was consumed, OR
 *   (b) a pending_payment booking was successfully paid.
 *
 * Valid transitions:
 *   confirmed → cancelled    (user/admin cancels)
 *   confirmed → attended     (trainer marks attendance)
 *   confirmed → no_show      (trainer marks no-show)
 */
class ConfirmedState implements BookingStateInterface
{
    public function cancel(): string
    {
        return 'cancelled';
    }

    public function markAttended(): string
    {
        return 'attended';
    }

    public function markNoShow(): string
    {
        return 'no_show';
    }
}
