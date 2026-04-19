<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'discount_amount',
        'discount_type',
        'is_active',
        'max_uses',
        'times_used',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'discount_amount' => 'decimal:2',
        'expires_at' => 'datetime',
    ];
}
