<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HealthInsight extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'provider',        // e.g., 'openweather', 'dailyhealthtip'
        'insight_type',    // e.g., 'weather', 'nutrition_tip', 'recovery_tip'
        'data',           // JSON encoded payload
        'generated_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'data' => 'array',
        'generated_at' => 'datetime',
    ];
}
