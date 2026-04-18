<?php

namespace App\Repositories\Eloquent;

use App\Models\Booking;
use App\Repositories\Contracts\BookingRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentBookingRepository implements BookingRepositoryInterface
{
    public function findById(int $id): ?Booking
    {
        return Booking::with('classSchedule.fitnessClass')->find($id);
    }

    public function findByUser(int $userId): Collection
    {
        return Booking::with('classSchedule.fitnessClass')
            ->where('user_id', $userId)
            ->orderByDesc('booked_at')
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
            ->where('status', 'booked')
            ->whereHas('classSchedule', function ($query) use ($date) {
                $query->whereDate('start_datetime', $date);
            })
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

    public function countBookingsForSchedule(int $scheduleId): int
    {
        return Booking::where('class_schedule_id', $scheduleId)
            ->where('status', 'booked')
            ->count();
    }
}
