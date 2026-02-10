<?php

namespace App\Repositories\Eloquent;

use App\Models\Payment;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentPaymentRepository implements PaymentRepositoryInterface
{
    public function findById(int $id): ?Payment
    {
        return Payment::with('membership.plan')->find($id);
    }

    public function findByUser(int $userId): Collection
    {
        return Payment::with('membership.plan')
            ->where('user_id', $userId)
            ->orderByDesc('paid_at')
            ->get();
    }

    public function findByMembership(int $membershipId): Collection
    {
        return Payment::where('membership_id', $membershipId)
            ->orderByDesc('paid_at')
            ->get();
    }

    public function create(array $data): Payment
    {
        return Payment::create($data);
    }

    public function update(Payment $payment, array $data): Payment
    {
        $payment->update($data);

        return $payment->fresh();
    }
}
