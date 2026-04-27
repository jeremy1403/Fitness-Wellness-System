<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MembershipPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'tier_name',
        'billing_cycle',
        'price',
        'booking_daily_limit',
        'booking_advance_days',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'booking_daily_limit' => 'integer',
        'booking_advance_days' => 'integer',
    ];

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
