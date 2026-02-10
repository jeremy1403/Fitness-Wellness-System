<?php

namespace App\Repositories\Contracts;

use App\Models\ClassSchedule;
use Illuminate\Database\Eloquent\Collection;

interface ClassScheduleRepositoryInterface
{
    public function findById(int $id): ?ClassSchedule;

    public function findWithClass(int $id): ?ClassSchedule;

    public function create(array $data): ClassSchedule;

    public function update(ClassSchedule $schedule, array $data): ClassSchedule;

    public function delete(ClassSchedule $schedule): bool;

    public function getAvailable(): Collection;

    public function getByTrainer(int $trainerId): Collection;
}
