<?php
namespace App\Observers;

use App\Models\Payment;
use App\Support\AppLogger;

class PaymentObserver
{
    // This automatically fires when a Payment is saved to the database
    public function created(Payment $payment): void
    {
        // Load the membership related to this payment
        $membership = $payment->membership;

        if (!$membership) {
            return;
        }

        // Load the plan to get duration_days
        $plan = $membership->plan;

        if (!$plan) {
            return;
        }

        // Extend the membership end date based on the plan duration
        $newEndDate = now()->addDays($plan->duration_days);

        $membership->update([
            'end_date' => $newEndDate,
            'status'   => 'active',
        ]);

        AppLogger::info('Membership expiry updated via PaymentObserver', [
            'payment_id'    => $payment->id,
            'membership_id' => $membership->id,
            'new_end_date'  => $newEndDate,
        ]);
    }
}