<?php

namespace App\Models;

use App\Domain\Booking\BookingStateFactory;
use App\Domain\Booking\States\BookingStateInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'class_schedule_id',
        'status',
        'booked_at',
        'cancelled_at',
        'is_quota_used',
    ];

    protected $casts = [
        'booked_at'     => 'datetime',
        'cancelled_at'  => 'datetime',
        'is_quota_used' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classSchedule(): BelongsTo
    {
        return $this->belongsTo(ClassSchedule::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function getState(): BookingStateInterface
    {
        return BookingStateFactory::make($this->status);
    }
}