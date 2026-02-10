<?php

namespace App\Repositories\Contracts;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Collection;

interface PaymentRepositoryInterface
{
    public function findById(int $id): ?Payment;

    public function findByUser(int $userId): Collection;

    public function findByMembership(int $membershipId): Collection;

    public function create(array $data): Payment;

    public function update(Payment $payment, array $data): Payment;
}
