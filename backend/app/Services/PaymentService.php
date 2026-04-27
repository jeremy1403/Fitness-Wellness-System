<?php

namespace App\Services;

use App\DTOs\Membership\ProcessPaymentData;
use App\DTOs\Membership\ProcessClassPaymentData;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PromoCode;
use App\Repositories\Contracts\BookingRepositoryInterface;
use App\Repositories\Contracts\MembershipRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\PromoCodeRepositoryInterface;
use App\Services\Contracts\PromoServiceInterface;
use App\Support\AppLogger;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(
        private readonly PaymentRepositoryInterface      $paymentRepository,
        private readonly MembershipRepositoryInterface   $membershipRepository,
        private readonly PromoServiceInterface           $promoService,
        private readonly PromoCodeRepositoryInterface    $promoCodeRepository,
        private readonly BookingRepositoryInterface      $bookingRepository,
    ) {}

    public function getUserPayments(int $userId): Collection
    {
        return $this->paymentRepository->findByUser($userId);
    }

    public function getMembershipPayments(int $membershipId): Collection
    {
        return $this->paymentRepository->findByMembership($membershipId);
    }

    /**
     * Process a new payment.
     *
     * If a promo code is present on the DTO:
     *  1. Re-validates the code for full integrity (expiry, usage, per-user limit).
     *  2. Calculates the discount, enforcing `max_discount_amount` for percentage promos.
     *  3. Stores `promo_code_id` + `discount_applied` on the payment record.
     *
     * Voucher redemption (incrementUsage + pivot) is intentionally deferred to
     * markAsPaid() so that cash / pending payments never consume the voucher
     * if they are never confirmed.
     */
    public function processPayment(ProcessPaymentData $data): Payment
    {
        $membership = $this->membershipRepository->findById($data->membershipId);

        if (!$membership) {
            throw new \Exception('Membership not found.');
        }

        if ($membership->user_id !== $data->userId) {
            throw new \Exception('Unauthorized.');
        }

        // ── Promo Code Validation & Discount Calculation ────────────────────
        $finalAmount      = $data->amount;
        $discountApplied  = 0.0;
        $promoCodeId      = null;

        if (!empty($data->promoCode)) {
            $validation = $this->promoService->validateCode($data->promoCode, $data->userId);

            if (!$validation['valid']) {
                throw new \Exception($validation['message']);
            }

            $details     = $validation['details'];
            $promoCodeId = $details['promo_code_id'];

            if ($details['discount_type'] === 'percentage') {
                // Calculate percentage of the original plan price
                $calculated = ($data->amount * $details['discount_amount']) / 100;

                // ── MAX CAP ENFORCEMENT (Critical Business Rule) ─────────────
                if (!is_null($details['max_discount_amount']) && $details['max_discount_amount'] > 0) {
                    $calculated = min($calculated, (float) $details['max_discount_amount']);
                }

                $discountApplied = $calculated;
            } else {
                // Flat discount — never exceed the original price
                $discountApplied = min((float) $details['discount_amount'], $data->amount);
            }

            $finalAmount = max(0, $data->amount - $discountApplied);
        }

        // ── Create Payment Record ────────────────────────────────────────────
        return DB::transaction(function () use ($data, $finalAmount, $discountApplied, $promoCodeId) {
            $status = $data->method === 'cash' ? 'pending' : 'paid';

            $payment = $this->paymentRepository->create([
                'membership_id'    => $data->membershipId,
                'user_id'          => $data->userId,
                'amount'           => $finalAmount,
                'method'           => $data->method,
                'status'           => $status,
                'paid_at'          => now(),
                'reference_no'     => $this->generateReferenceNo(),
                'promo_code_id'    => $promoCodeId,
                'discount_applied' => $discountApplied,
            ]);

            AppLogger::info('payment', 'Payment created', [
                'user_id'          => $data->userId,
                'payment_id'       => $payment->id,
                'reference_no'     => $payment->reference_no,
                'method'           => $payment->method,
                'status'           => $payment->status,
                'promo_code_id'    => $promoCodeId,
                'discount_applied' => $discountApplied,
            ]);

            // ── Redemption Hook (TOCTOU Fix) ─────────────────────────────────
            // For card/transfer, payment is immediately "paid" — redeem now.
            // For cash, the payment is "pending" — redemption fires in markAsPaid().
            if ($status === 'paid' && $promoCodeId) {
                // Pessimistic Lock to prevent Race Condition
                $lockedPromo = PromoCode::where('id', $promoCodeId)->lockForUpdate()->first();
                if (!$lockedPromo) {
                    throw new \Exception('Promo code no longer exists.');
                }
                if ($lockedPromo->max_uses !== null && $lockedPromo->times_used >= $lockedPromo->max_uses) {
                    throw new \Exception('Promo code usage limit reached during checkout.');
                }
                if ($this->promoCodeRepository->hasUserUsedCode($data->userId, $promoCodeId)) {
                    throw new \Exception('You have already used this promo code.');
                }

                $this->redeemPromo($promoCodeId, $data->userId);
            }

            return $payment;
        });
    }

    /**
     * Process a pay-per-class (à-la-carte) payment.
     *
     * Atomically:
     *  1. Validates the booking belongs to the user and is awaiting payment.
     *  2. Validates the submitted amount is >= the class's list price (anti-tamper).
     *  3. Creates a Payment record linked to the booking (no membership).
     *  4. Transitions the Booking status from 'pending_payment' → 'confirmed'.
     */
    public function processClassPayment(ProcessClassPaymentData $data): Payment
    {
        return DB::transaction(function () use ($data) {
            // Lock the schedule to prevent overbooking
            $schedule = \App\Models\ClassSchedule::lockForUpdate()->findOrFail($data->scheduleId);

            // Calculate base price dynamically
            $minutes = \Carbon\Carbon::parse($schedule->start_datetime)
                ->diffInMinutes(\Carbon\Carbon::parse($schedule->end_datetime));
            $classPrice = ceil($minutes / 5) * 3;

            if ($data->amount < $classPrice) {
                throw new \Exception(
                    "Payment amount (RM {$data->amount}) is less than the class price (RM {$classPrice})."
                );
            }

            // ── Promo Code Validation & Discount Calculation ────────────────────
            $finalAmount      = $data->amount;
            $discountApplied  = 0.0;
            $promoCodeId      = null;

            if (!empty($data->promoCode)) {
                $validation = $this->promoService->validateCode($data->promoCode, $data->userId);

                if (!$validation['valid']) {
                    throw new \Exception($validation['message']);
                }

                $details     = $validation['details'];
                $promoCodeId = $details['promo_code_id'];

                if ($details['discount_type'] === 'percentage') {
                    // Calculate percentage of the original class price
                    $calculated = ($data->amount * $details['discount_amount']) / 100;

                    // ── MAX CAP ENFORCEMENT (Critical Business Rule) ─────────────
                    if (!is_null($details['max_discount_amount']) && $details['max_discount_amount'] > 0) {
                        $calculated = min($calculated, (float) $details['max_discount_amount']);
                    }

                    $discountApplied = $calculated;
                } else {
                    // Flat discount — never exceed the original price
                    $discountApplied = min((float) $details['discount_amount'], $data->amount);
                }

                $finalAmount = max(0, $data->amount - $discountApplied);
            }

            $status = $data->method === 'cash' ? 'pending_payment' : 'confirmed';

            // DEFERRED CREATION: Insert the booking now
            $booking = $this->bookingRepository->create([
                'user_id'           => $data->userId,
                'class_schedule_id' => $data->scheduleId,
                'status'            => $status,
                'is_quota_used'     => false,
                'booked_at'         => now(),
            ]);

            $paymentStatus = $data->method === 'cash' ? 'pending' : 'paid';

            // Create payment linked to the booking (not a membership)
            $payment = $this->paymentRepository->create([
                'membership_id'    => null,
                'booking_id'       => $booking->id,
                'user_id'          => $data->userId,
                'amount'           => $finalAmount,
                'method'           => $data->method,
                'status'           => $paymentStatus,
                'paid_at'          => now(),
                'reference_no'     => $this->generateReferenceNo(),
                'promo_code_id'    => $promoCodeId,
                'discount_applied' => $discountApplied,
            ]);

            AppLogger::info('payment', 'Class payment created', [
                'user_id'          => $data->userId,
                'schedule_id'      => $data->scheduleId,
                'booking_id'       => $booking->id,
                'payment_id'       => $payment->id,
                'method'           => $payment->method,
                'status'           => $payment->status,
                'promo_code_id'    => $promoCodeId,
                'discount_applied' => $discountApplied,
            ]);

            // Only confirm the booking immediately for non-cash payments.
            // Cash payments stay pending_payment until admin runs markAsPaid().
            if ($paymentStatus === 'paid') {
                AppLogger::info('payment', 'Booking confirmed after class payment', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                ]);

                // ── Redemption Hook (TOCTOU Fix) ─────────────────────────────────
                // For card/transfer, payment is immediately "paid" — redeem now.
                if ($promoCodeId) {
                    // Pessimistic Lock to prevent Race Condition
                    $lockedPromo = PromoCode::where('id', $promoCodeId)->lockForUpdate()->first();
                    if (!$lockedPromo) {
                        throw new \Exception('Promo code no longer exists.');
                    }
                    if ($lockedPromo->max_uses !== null && $lockedPromo->times_used >= $lockedPromo->max_uses) {
                        throw new \Exception('Promo code usage limit reached during checkout.');
                    }
                    if ($this->promoCodeRepository->hasUserUsedCode($data->userId, $promoCodeId)) {
                        throw new \Exception('You have already used this promo code.');
                    }

                    $this->redeemPromo($promoCodeId, $data->userId);
                }
            }

            return $payment;
        });
    }

    public function getPaymentById(int $paymentId): Payment
    {
        $payment = $this->paymentRepository->findById($paymentId);

        if (!$payment) {
            throw new \Exception('Payment not found.');
        }

        return $payment;
    }

    /**
     * Admin action: mark a cash/pending payment as paid.
     *
     * This is also the redemption hook for cash payments — the voucher is
     * officially consumed here (not at the time the user submits the form)
     * to prevent voucher wastage on transactions that are never confirmed.
     */
    public function markAsPaid(int $paymentId): Payment
    {
        $payment = $this->paymentRepository->findById($paymentId);

        if (!$payment) {
            throw new \Exception('Payment not found.');
        }

        if ($payment->status === 'paid') {
            throw new \Exception('Payment is already marked as paid.');
        }

        $updated = $this->paymentRepository->update($payment, [
            'status'  => 'paid',
            'paid_at' => now(),
        ]);

        AppLogger::info('payment', 'Payment marked as paid by admin', [
            'payment_id'   => $updated->id,
            'reference_no' => $updated->reference_no,
        ]);

        // ── Redemption Hook for Cash Payments (Membership) (TOCTOU Fix) ──────
        // Only fires if this payment had a promo attached and had been pending.
        if ($updated->promo_code_id) {
            DB::transaction(function () use ($updated) {
                $lockedPromo = PromoCode::where('id', $updated->promo_code_id)->lockForUpdate()->first();
                if ($lockedPromo && ($lockedPromo->max_uses === null || $lockedPromo->times_used < $lockedPromo->max_uses)) {
                    if (!$this->promoCodeRepository->hasUserUsedCode($updated->user_id, $updated->promo_code_id)) {
                        $this->redeemPromo($updated->promo_code_id, $updated->user_id);
                    }
                }
            });
        }

        // ── Booking Confirmation Hook for Cash Class Payments ────────────────
        // If this payment is linked to a booking (not a membership), confirm it.
        if ($updated->booking_id) {
            $booking = $this->bookingRepository->findById($updated->booking_id);
            if ($booking && $booking->status === 'pending_payment') {
                $this->bookingRepository->update($booking, ['status' => 'confirmed']);

                AppLogger::info('payment', 'Booking confirmed after admin cash class payment', [
                    'booking_id' => $updated->booking_id,
                    'payment_id' => $updated->id,
                ]);
            }
        }

        return $updated;
    }

    /**
     * Officially redeem a promo code:
     *  - Increment `times_used` on the promo_codes table.
     *  - Insert the user into the `promo_code_user` pivot to prevent reuse.
     */
    private function redeemPromo(int $promoCodeId, int $userId): void
    {
        $promo = $this->promoCodeRepository->findById($promoCodeId);

        if (!$promo) {
            return;
        }

        // Increment global usage counter
        $this->promoCodeRepository->incrementUsage($promo);

        // Attach user to pivot (prevents double-redemption via hasUserUsedCode check)
        $promo->redeemedByUsers()->syncWithoutDetaching([
            $userId => ['used_at' => now()],
        ]);

        AppLogger::info('payment', 'Promo code redeemed', [
            'promo_code_id' => $promoCodeId,
            'user_id'       => $userId,
        ]);
    }

    private function generateReferenceNo(): string
    {
        do {
            $ref = 'PAY-' . strtoupper(Str::random(10));
        } while (Payment::where('reference_no', $ref)->exists());

        return $ref;
    }
}