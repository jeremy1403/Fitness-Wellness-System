<?php

namespace App\Repositories\Contracts;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Collection;

interface BookingRepositoryInterface
{
    public function findById(int $id): ?Booking;

    public function findByUser(int $userId): Collection;

    public function existsForSchedule(int $userId, int $classScheduleId): bool;

    public function countUserBookingsForDate(int $userId, string $date): int;

    public function create(array $data): Booking;

    public function update(Booking $booking, array $data): Booking;

    public function countBookingsForSchedule(int $scheduleId): int;
}
