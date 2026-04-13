<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClassScheduleController extends Controller
{
    //Retrieve all course schedules  including related data
    public function index(): JsonResponse
    {
        $schedules = ClassSchedule::with(['fitnessClass', 'trainer'])
            ->latest('start_datetime')
            ->get();

        return response()->json($schedules);
    }
    

    //Save new schedule
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fitness_class_id' => 'required|exists:fitness_classes,id',
            'trainer_id'       => 'required|exists:users,id',
            'start_datetime'       => 'required|date',
            'end_datetime'         => 'required|date|after:start_datetime',
            'capacity'         => 'required|integer',
        ]);

        $schedule = ClassSchedule::create($validated);

        return response()->json([
            'message' => 'Schedule created successfully!',
            'data' => $schedule->load(['fitnessClass', 'trainer'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'fitness_class_id' => 'required',
            'trainer_id'       => 'required',
            'start_datetime'   => 'required|date',
            'end_datetime'     => 'required|date',
            'capacity'         => 'required|integer|min:1',
        ]);

        $schedule = ClassSchedule::find($id);

        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        $schedule->update($validated);

        return response()->json([
            'message' => 'Schedule updated successfully!',
            'data' => $schedule
        ]);
    }
    //Delete scheduling
    public function destroy($id): JsonResponse
    {
        $schedule = ClassSchedule::find($id);

        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        $schedule->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}