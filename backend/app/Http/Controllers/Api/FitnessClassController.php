<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Classes\StoreFitnessClassRequest; // 新增：自定义 Request
use App\Services\FitnessClassService;
use Illuminate\Http\JsonResponse;
use App\Models\FitnessClass;


class FitnessClassController extends Controller
{
    // 使用构造函数注入 Service
    public function __construct(
        protected FitnessClassService $fitnessClassService
    ) {}

    public function index(): JsonResponse
    {
        // 统一通过 Service 获取数据
        $classes = $this->fitnessClassService->getAllClasses();
        return response()->json($classes);
    }

    public function store(StoreFitnessClassRequest $request): JsonResponse
    {
        // $request->validated() 确保只获取验证过的数据，防止批量赋值漏洞
        $fitnessClass = $this->fitnessClassService->createClass($request->validated());

        return response()->json([
            'message' => 'Created successfully!',
            'data' => $fitnessClass
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->fitnessClassService->deleteClass($id);

        if (!$deleted) {
            return response()->json(['message' => 'Class not found or could not be deleted'], 404);
        }

        return response()->json(['message' => 'Class deleted successfully!'], 200);
    }
}