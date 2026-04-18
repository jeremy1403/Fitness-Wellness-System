<?php

namespace App\Services;

use App\Models\FitnessClass;
use App\Repositories\Contracts\FitnessClassRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class FitnessClassService
{
    public function __construct(
        protected FitnessClassRepositoryInterface $repository
    ) {}

    public function getAllClasses(): Collection
    {
        $user = Auth::user();

        if (!$user) {
            // If you are not logged in, return all or process according 
            return FitnessClass::all(); 
        }

        // Admin (role is 1) View all
        if ($user->role === 1) { 
            return FitnessClass::all();
        }

        // Trainer only looks at himself
        return FitnessClass::where('created_by', $user->id)->get();
    }

    public function getActiveClasses(): Collection
    {
        return $this->repository->getActive();
    }

    public function getClassById(int $id): ?FitnessClass
    {
        return $this->repository->findById($id);
    }

    public function createClass(array $data)
    {
        return DB::transaction(function () use ($data) {
            // 1. Create the base record first
            // Use a fallback for duration_minutes so the DB doesn't crash if it's missing
            $fitnessClass = $this->repository->create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'duration_minutes' => $data['duration_minutes'] ?? 60,
                'status'           => $data['status'] ?? 'active',
                'created_by'       => $data['created_by'],
            ]);

            // 2. The Strategy handles ALL the specific setup details
            $mode = $data['setup_mode'] ?? 'simple';
            $strategy = \App\Services\Factories\ClassSetupFactory::make($mode);
            $strategy->setup($fitnessClass, $data);

            return $fitnessClass;
        });
    }

    public function updateClass(int $id, array $data): FitnessClass
    {
        $fitnessClass = $this->repository->findById($id);

        if (! $fitnessClass) {
            throw new \Exception('Fitness class not found');
        }

        return $this->repository->update($fitnessClass, $data);
    }

    public function deleteClass(int $id): bool
    {
        $fitnessClass = $this->repository->findById($id);

        if (! $fitnessClass) {
            return false;
        }

        return $this->repository->delete($fitnessClass);
    }
}
