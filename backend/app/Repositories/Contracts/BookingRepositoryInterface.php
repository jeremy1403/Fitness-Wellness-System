<?php

namespace App\Repositories\Contracts;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Collection;

interface BookingRepositoryInterface
{
    public function findById(int $id): ?Booking;

    public function findAll(): Collection;

    public function findByUser(int $userId): Collection;

    public function findBySchedule(int $scheduleId): Collection;

    public function existsForSchedule(int $userId, int $classScheduleId): bool;

    /**
     * Count bookings for a specific date that consume or could consume a quota slot.
     * Includes statuses: 'confirmed', 'pending_payment', 'booked' (legacy).
     * Excludes 'cancelled', 'attended', 'no_show'.
     */
    public function countActiveBookingsForDate(int $userId, string $date): int;

    public function countBookingsForSchedule(int $scheduleId): int;

    public function create(array $data): Booking;

    public function update(Booking $booking, array $data): Booking;
}