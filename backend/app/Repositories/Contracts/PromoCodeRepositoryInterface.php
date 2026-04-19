<?php

namespace App\Repositories\Contracts;

use App\Models\PromoCode;

interface PromoCodeRepositoryInterface
{
    public function findByCode(string $code): ?PromoCode;
    public function incrementUsage(PromoCode $promoCode): bool;
    public function hasUserUsedCode(int $userId, int $promoCodeId): bool;
    public function getAll();
    public function getSorted(string $sort = 'newest');
    public function getByTrainer(int $trainerUserId);
    public function create(array $data);
    public function findById(int $id);
    public function update(int $id, array $data);
    public function delete(int $id);
}
