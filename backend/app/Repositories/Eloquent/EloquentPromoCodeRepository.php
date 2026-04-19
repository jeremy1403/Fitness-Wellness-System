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

    public function getAll()
    {
        return PromoCode::all();
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
