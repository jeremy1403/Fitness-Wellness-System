<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'status'       => $this->status,
            'booked_at'    => $this->booked_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'class_schedule' => $this->whenLoaded('classSchedule', fn() => [
                'id'             => $this->classSchedule->id,
                'start_datetime' => $this->classSchedule->start_datetime?->toIso8601String(),
                'end_datetime'   => $this->classSchedule->end_datetime?->toIso8601String(),
                'capacity'       => $this->classSchedule->capacity,
                'status'         => $this->classSchedule->status,
                'fitness_class'  => $this->whenLoaded('classSchedule', fn() =>
                    $this->classSchedule->relationLoaded('fitnessClass')
                        ? [
                            'id'               => $this->classSchedule->fitnessClass->id,
                            'title'            => $this->classSchedule->fitnessClass->title,
                            'description'      => $this->classSchedule->fitnessClass->description,
                            'duration_minutes' => $this->classSchedule->fitnessClass->duration_minutes,
                        ]
                        : null
                ),
            ]),
            'user' => $this->whenLoaded('user', fn() => [
                'id'     => $this->user->id,
                'name'   => $this->user->name,
                'email'  => $this->user->email,
                'status' => $this->user->status,
            ]),
        ];
    }
}