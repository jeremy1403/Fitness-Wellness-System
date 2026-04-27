<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PromoCode extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * Prevents Mass Assignment Vulnerabilities.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'trainer_id',
        'required_tier',
        'discount_amount',
        'discount_type',
        'max_discount_amount',
        'min_spend_amount',
        'is_new_user_only',
        'is_targeted',
        'is_active',
        'max_uses',
        'times_used',
        'expires_at',
    ];

    protected $casts = [
        'is_active'           => 'boolean',
        'is_new_user_only'    => 'boolean',
        'is_targeted'         => 'boolean',
        'discount_amount'     => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'min_spend_amount'    => 'decimal:2',
        'expires_at'          => 'datetime',
    ];

    /**
     * Users explicitly targeted by this promo code (if is_targeted = true).
     */
    public function targetUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'promo_code_targets')
                    ->withTimestamps();
    }

    /**
     * The trainer (User) who created this promo code. Null = admin-issued.
     */
    public function trainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    /**
     * The membership tier required to redeem this code. Null = open to everyone.
     */
    public function getRequiredTierAttribute($value)
    {
        return $value;
    }

    /**
     * The users who have redeemed this promo code (pivot: promo_code_user).
     */
    public function redeemedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'promo_code_user')
                    ->withPivot('used_at')
                    ->withTimestamps();
    }
}
