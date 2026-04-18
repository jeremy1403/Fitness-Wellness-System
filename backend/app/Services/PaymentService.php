<?php

namespace App\Services;

use App\DTOs\Membership\ProcessPaymentData;
use App\Models\Payment;
use App\Repositories\Contracts\MembershipRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Support\AppLogger;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(
        private readonly PaymentRepositoryInterface $paymentRepository,
        private readonly MembershipRepositoryInterface $membershipRepository,
    ) {}

    public function getUserPayments(int $userId): Collection
    {
        return $this->paymentRepository->findByUser($userId);
    }

    public function getMembershipPayments(int $membershipId): Collection
    {
        return $this->paymentRepository->findByMembership($membershipId);
    }

    public function processPayment(ProcessPaymentData $data): Payment
    {
        $membership = $this->membershipRepository->findById($data->membershipId);

        if (!$membership) {
            throw new \Exception('Membership not found.');
        }

        if ($membership->user_id !== $data->userId) {
            throw new \Exception('Unauthorized.');
        }

        return DB::transaction(function () use ($data) {
            $status = $data->method === 'cash' ? 'pending' : 'paid';

            $payment = $this->paymentRepository->create([
                'membership_id' => $data->membershipId,
                'user_id'       => $data->userId,
                'amount'        => $data->amount,
                'method'        => $data->method,
                'status'        => $status,
                'paid_at'       => now(),
                'reference_no'  => $this->generateReferenceNo(),
            ]);

            AppLogger::info('payment', 'Payment created', [
                'user_id'      => $data->userId,
                'payment_id'   => $payment->id,
                'reference_no' => $payment->reference_no,
                'method'       => $payment->method,
                'status'       => $payment->status,
            ]);

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

        return $updated;
    }

    private function generateReferenceNo(): string
    {
        do {
            $ref = 'PAY-' . strtoupper(Str::random(10));
        } while (Payment::where('reference_no', $ref)->exists());

        return $ref;
    }
}