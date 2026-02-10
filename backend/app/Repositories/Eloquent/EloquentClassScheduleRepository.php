<?php

namespace App\Repositories\Eloquent;

use App\Models\ClassSchedule;
use App\Repositories\Contracts\ClassScheduleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentClassScheduleRepository implements ClassScheduleRepositoryInterface
{
    public function findById(int $id): ?ClassSchedule
    {
        return ClassSchedule::find($id);
    }

    public function findWithClass(int $id): ?ClassSchedule
    {
        return ClassSchedule::with(['fitnessClass', 'trainer.user'])->find($id);
    }

    public function create(array $data): ClassSchedule
    {
        return ClassSchedule::create($data);
    }

    public function update(ClassSchedule $schedule, array $data): ClassSchedule
    {
        $schedule->update($data);

        return $schedule->fresh();
    }

    public function delete(ClassSchedule $schedule): bool
    {
        return $schedule->delete();
    }

    public function getAvailable(): Collection
    {
        return ClassSchedule::with(['fitnessClass', 'trainer.user'])
            ->where('status', 'open')
            ->where('start_datetime', '>', now())
            ->orderBy('start_datetime')
            ->get();
    }

    public function getByTrainer(int $trainerId): Collection
    {
        return ClassSchedule::with('fitnessClass')
            ->where('trainer_id', $trainerId)
            ->orderBy('start_datetime')
            ->get();
    }
}
