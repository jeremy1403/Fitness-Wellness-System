<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FitnessClass extends Model
{
    use HasFactory;

    protected $table = 'fitness_classes';

protected $fillable = [
        'title',
        'description',
        'duration_minutes',
        'capacity',
        'setup_mode',
        'status',
        'created_by'
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
    ];

    public function schedules(): HasMany
    {
        return $this->hasMany(ClassSchedule::class, 'fitness_class_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
