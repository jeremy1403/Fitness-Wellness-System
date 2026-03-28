<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FitnessClass; 
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FitnessClassController extends Controller
{
    /**
     * 获取所有课程列表
     */
    public function index(): JsonResponse
    {
        // 建议加上 latest()，这样新创建的课会显示在最上面
        $classes = FitnessClass::latest()->get();
        return response()->json($classes);
    }

    /**
     * 保存新课程
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:15',
        ]);

        $fitnessClass = FitnessClass::create($validated);

        return response()->json([
            'message' => 'Created successfully!',
            'data' => $fitnessClass
        ], 201);
    }

    /**
     * 👇 新增：删除课程 (用于配合前端的 Delete 按钮)
     */
    public function destroy($id): JsonResponse
    {
        $fitnessClass = FitnessClass::find($id);

        if (!$fitnessClass) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        $fitnessClass->delete();

        return response()->json([
            'message' => 'Class deleted successfully!'
        ], 200);
    }
}