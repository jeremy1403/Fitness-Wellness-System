<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassScheduleController extends Controller
{
    // Retrieve all course schedules  including related data
    public function index(): JsonResponse
    {
        $schedules = ClassSchedule::with(['fitnessClass', 'trainer.user'])
            ->latest('start_datetime')
            ->get();

        return response()->json([
            'data' => $schedules,
        ]);
    }

 // Save new schedule
// Save new schedule
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fitness_class_id' => [
                'required',
                'exists:fitness_classes,id',
                \Illuminate\Validation\Rule::unique('class_schedules')->where(function ($query) use ($request) {
                    return $query->where('trainer_id', $request->trainer_id)
                                 ->where('start_datetime', $request->start_datetime); // <--- 加上时间的判断！
                }),
            ],
            'trainer_id' => 'required|exists:trainers,id',
            
            'start_datetime'   => 'required|date|after:now',
            'end_datetime'   => 'required|date|after:start_datetime',
            'capacity'         => 'required|integer|min:1|max:30',
        ], [
            
            'fitness_class_id.unique' => 'You already have this class scheduled at this exact time!',
            'start_datetime.after' => 'The start time cannot be in the past.',
        ]);

        $schedule = ClassSchedule::create($validated);

        return response()->json([
            'message' => 'Schedule created successfully!',
            'data' => $schedule->load(['fitnessClass', 'trainer.user']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'fitness_class_id' => 'required',
            'trainer_id' => 'required',
            'start_datetime' => 'required|date',
            'end_datetime' => 'required|date',
            'capacity' => 'required|integer|min:1',
        ]);

        $schedule = ClassSchedule::find($id);

        if (! $schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        $schedule->update($validated);

        return response()->json([
            'message' => 'Schedule updated successfully!',
            'data' => $schedule,
        ]);
    }

    // Delete scheduling
    public function destroy($id): JsonResponse
    {
        $schedule = ClassSchedule::find($id);

        if (! $schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        $schedule->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
