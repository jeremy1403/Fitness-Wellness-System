<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClassScheduleController extends Controller
{
    /**
     * 获取所有排课列表 (包含关联数据)
     */
    public function index(): JsonResponse
    {
        // 使用 Eager Loading (with) 加载课程和教练详情
        // 这样前端 item.fitness_class.title 才有值
        $schedules = ClassSchedule::with(['fitnessClass', 'trainer'])
            ->latest('start_datetime')
            ->get();

        return response()->json($schedules);
    }
    

    /**
     * 保存新排课
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fitness_class_id' => 'required|exists:fitness_classes,id',
            'trainer_id'       => 'required|exists:users,id',
            'start_datetime'       => 'required|date',
            'end_datetime'         => 'required|date|after:start_datetime',
            'capacity'         => 'required|integer',
        ]);

        // 进阶需求：可以在这里检查该教练在同一时间段是否已经有课
        // $exists = ClassSchedule::where('trainer_id', $request->trainer_id)
        //     ->where('start_datetime', '<', $request->end_time)
        //     ->where('end_time', '>', $request->start_datetime)
        //     ->exists();
        // if ($exists) return response()->json(['message' => 'Trainer is busy!'], 422);

        $schedule = ClassSchedule::create($validated);

        // 返回时重新加载关联，方便前端直接渲染
        return response()->json([
            'message' => 'Schedule created successfully!',
            'data' => $schedule->load(['fitnessClass', 'trainer.user'])
        ], 201);
    }

    /**
     * 删除排课
     */
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