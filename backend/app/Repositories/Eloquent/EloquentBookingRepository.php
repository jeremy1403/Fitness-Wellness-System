<?php

namespace App\Repositories\Eloquent;

use App\Models\Booking;
use App\Repositories\Contracts\BookingRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentBookingRepository implements BookingRepositoryInterface
{
    public function findById(int $id): ?Booking
    {
        return Booking::with(['classSchedule.fitnessClass', 'classSchedule.trainer.user'])->find($id);
    }

    public function findAll(): Collection
    {
        return Booking::with(['classSchedule.fitnessClass', 'classSchedule.trainer.user', 'user'])
            ->orderByDesc('booked_at')
            ->get();
    }

    public function findByUser(int $userId): Collection
    {
        return Booking::with(['classSchedule.fitnessClass', 'classSchedule.trainer.user'])
            ->where('user_id', $userId)
            ->orderByDesc('booked_at')
            ->get();
    }

    public function findBySchedule(int $scheduleId): Collection
    {
        return Booking::with('user')
            ->where('class_schedule_id', $scheduleId)
            ->orderBy('booked_at')
            ->get();
    }

    public function existsForSchedule(int $userId, int $classScheduleId): bool
    {
        return Booking::where('user_id', $userId)
            ->where('class_schedule_id', $classScheduleId)
            ->exists();
    }

    public function countUserBookingsForDate(int $userId, string $date): int
    {
        return Booking::where('user_id', $userId)
            ->where('status', 'booked') // legacy only — kept for DynamicBookingPolicy
            ->whereHas('classSchedule', function ($query) use ($date) {
                $query->whereDate('start_datetime', $date);
            })
            ->count();
    }

    /**
     * Count all bookings that occupy a quota slot for a given date.
     * Used by the new Decision Engine in BookingService.
     */
    public function countActiveBookingsForDate(int $userId, string $date): int
    {
        return Booking::where('user_id', $userId)
            ->whereIn('status', ['confirmed', 'pending_payment', 'booked'])
            ->whereHas('classSchedule', function ($query) use ($date) {
                $query->whereDate('start_datetime', $date);
            })
            ->count();
    }

    public function countBookingsForSchedule(int $scheduleId): int
    {
        return Booking::where('class_schedule_id', $scheduleId)
            ->whereIn('status', ['confirmed', 'pending_payment', 'booked'])
            ->count();
    }

    public function create(array $data): Booking
    {
        return Booking::create($data);
    }

    public function update(Booking $booking, array $data): Booking
    {
        $booking->update($data);
        return $booking->fresh();
    }
}