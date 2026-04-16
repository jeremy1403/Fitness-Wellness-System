<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Trainer;

class ClassSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'fitness_class_id',
        'trainer_id',
        'start_datetime',
        'end_datetime',
        'capacity',
        'status',
    ];

    protected $casts = [
        'start_datetime' => 'datetime',
        'end_datetime' => 'datetime',
        'capacity' => 'integer',
    ];

    public function fitnessClass(): BelongsTo
    {
        return $this->belongsTo(FitnessClass::class, 'fitness_class_id');
    }

    public function trainer(): BelongsTo
    {
        return $this->belongsTo(Trainer::class, 'trainer_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }
}
