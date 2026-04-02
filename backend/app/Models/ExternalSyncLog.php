<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExternalSyncLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'adapter_name', // e.g., 'OpenWeatherAdapter'
        'endpoint',
        'status',       // e.g., 'success', 'failed'
        'response_time',// in ms
        'error_message',
    ];
}
