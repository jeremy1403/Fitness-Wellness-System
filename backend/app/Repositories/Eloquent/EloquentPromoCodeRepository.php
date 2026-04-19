<?php

namespace App\Repositories\Eloquent;

use App\Models\PromoCode;
use App\Repositories\Contracts\PromoCodeRepositoryInterface;

class EloquentPromoCodeRepository implements PromoCodeRepositoryInterface
{
    public function findByCode(string $code): ?PromoCode
    {
        return PromoCode::where('code', $code)->first();
    }

    public function incrementUsage(PromoCode $promoCode): bool
    {
        $promoCode->times_used++;
        return $promoCode->save();
    }

    public function hasUserUsedCode(int $userId, int $promoCodeId): bool
    {
        return \App\Models\User::find($userId)
            ?->usedPromoCodes()
            ->where('promo_code_id', $promoCodeId)
            ->exists() ?? false;
    }

    public function getAll()
    {
        return PromoCode::all();
    }

    public function getSorted(string $sort = 'newest')
    {
        return match ($sort) {
            'expiring_soon' => PromoCode::orderByRaw('expires_at IS NULL, expires_at ASC')->get(),
            'most_used'     => PromoCode::orderByDesc('times_used')->get(),
            default         => PromoCode::orderByDesc('created_at')->get(), // 'newest'
        };
    }

    public function getByTrainer(int $trainerUserId)
    {
        return PromoCode::where('trainer_id', $trainerUserId)->get();
    }

    public function create(array $data)
    {
        return PromoCode::create($data);
    }

    public function findById(int $id)
    {
        return PromoCode::findOrFail($id);
    }

    public function update(int $id, array $data)
    {
        $promo = PromoCode::findOrFail($id);
        $promo->update($data);
        return $promo;
    }

    public function delete(int $id)
    {
        $promo = PromoCode::findOrFail($id);
        return $promo->delete();
    }
}
