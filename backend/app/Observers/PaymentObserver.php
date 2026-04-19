<?php

namespace App\Observers;

use App\Models\Payment;
use App\Support\AppLogger;

class PaymentObserver
{
    public function created(Payment $payment): void
    {
        $this->activateMembershipIfPaid($payment);
    }

    public function updated(Payment $payment): void
    {
        if ($payment->wasChanged('status')) {
            $this->activateMembershipIfPaid($payment);
        }
    }

    private function activateMembershipIfPaid(Payment $payment): void
    {
        if ($payment->status !== 'paid') {
            return;
        }

        $membership = $payment->membership;
        if (!$membership) {
            return;
        }

        $plan = $membership->plan;
        if (!$plan) {
            return;
        }

        $newEndDate = now()->addDays($plan->duration_days);

        $membership->update([
            'end_date' => $newEndDate,
            'status'   => 'active',
        ]);

        AppLogger::info('membership', 'Membership expiry updated via PaymentObserver', [
            'payment_id'    => $payment->id,
            'membership_id' => $membership->id,
            'new_end_date'  => $newEndDate,
            'payment_status'=> $payment->status,
        ]);
    }
}