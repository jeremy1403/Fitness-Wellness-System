<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trainer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialty',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classSchedules(): HasMany
    {
        return $this->hasMany(ClassSchedule::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
