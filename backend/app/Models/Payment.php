<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'membership_id',
        'user_id',
        'amount',
        'method',
        'status',
        'paid_at',
        'reference_no',
        'promo_code_id',
        'discount_applied',
    ];

    protected $casts = [
        'amount'           => 'decimal:2',
        'discount_applied' => 'decimal:2',
        'paid_at'          => 'datetime',
    ];

    public function membership(): BelongsTo
    {
        return $this->belongsTo(Membership::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class);
    }
}
