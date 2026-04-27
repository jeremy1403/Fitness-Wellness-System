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
        'daily_free_quota',
        'max_daily_bookings',
        'booking_advance_days',
        'duration_days',
        'status',
        'is_hidden_from_members',
        'tier_level',
    ];

    protected $casts = [
        'price'                  => 'decimal:2',
        'daily_free_quota'       => 'integer',
        'max_daily_bookings'     => 'integer',
        'booking_advance_days'   => 'integer',
        'duration_days'          => 'integer',
        'is_hidden_from_members' => 'boolean',
        'tier_level'             => 'integer',
    ];

    /**
     * Scope: only return plans visible on the member-facing catalog.
     *
     * Usage: MembershipPlan::visibleToMembers()->get();
     */
    public function scopeVisibleToMembers($query)
    {
        return $query->where('is_hidden_from_members', false);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
