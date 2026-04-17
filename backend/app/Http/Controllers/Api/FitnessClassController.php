<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Classes\StoreFitnessClassRequest; // 新增：自定义 Request
use App\Models\FitnessClass;
use App\Services\FitnessClassService;
use Illuminate\Http\JsonResponse;

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

    // public function store(StoreFitnessClassRequest $request): JsonResponse
    // {
    //     // 1. 获取验证后的原始数据
    //     $validatedData = $request->validated();
        
    //     // 2. 将前端传来的 user_id 放入数组，重命名为 created_by 以匹配数据库字段
    //     // 如果前端传来的是 user_id，我们就取这个；如果没有，默认取 1 (Admin)
    //     $validatedData['created_by'] = $request->input('user_id', 1);

    //     // 3. 重要：传入修改后的 $validatedData，而不是原本的 $request->validated()
    //     $fitnessClass = $this->fitnessClassService->createClass($validatedData);

    //     return response()->json([
    //         'message' => 'Created successfully!',
    //         'data' => $fitnessClass
    //     ], 201);
    // }
    public function store(StoreFitnessClassRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        // 调试步骤 1：看看前端到底传了什么过来
        // 如果你在控制台看到 user_id 为 null，说明是前端的问题
        // \Log::info($request->all()); 

        // 获取前端传来的 ID
        $frontendUserId = $request->input('user_id');

        // 调试步骤 2：强制赋值，不要给默认值 1
        if (!$frontendUserId) {
            return response()->json(['message' => 'Frontend failed to provide user_id'], 400);
        }

        $validatedData['created_by'] = $frontendUserId;

        // 确保这里传入的是 $validatedData
        $fitnessClass = $this->fitnessClassService->createClass($validatedData);

        return response()->json([
            'message' => 'Created successfully!',
            'data' => $fitnessClass,
        ], 201);
    }

    // public function update(StoreFitnessClassRequest $request, int $id): JsonResponse
    // {
    //     // 1. 查找是否存在
    //     $fitnessClass = FitnessClass::find($id);
    //     if (! $fitnessClass) {
    //         return response()->json(['message' => 'Class not found'], 404);
    //     }

    //     // 只有 Admin 或者 该课的创建者 才能更新
    //     if (auth()->user()->role !== 1 && $fitnessClass->created_by !== auth()->id()) {
    //         return response()->json(['message' => 'Unauthorized'], 403);
    //     }

    //     // 2. 更新数据 (validated 确保数据安全)
    //     $fitnessClass->update($request->validated());

    //     return response()->json([
    //         'message' => 'Updated successfully!',
    //         'data' => $fitnessClass,
    //     ], 200);
    // }
    public function update(StoreFitnessClassRequest $request, int $id): JsonResponse
    {
        $fitnessClass = FitnessClass::find($id);
        if (!$fitnessClass) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        // 1. 获取前端传来的所有数据
        $data = $request->all(); 

        // 2. 关键：把 user_id 换成数据库认识的 created_by
        if (isset($data['user_id'])) {
            $data['created_by'] = $data['user_id'];
            // 删掉 user_id，防止 Laravel 报错或产生歧义
            unset($data['user_id']); 
        }

        // 3. 执行更新
        $fitnessClass->update($data);

        // 4. 重新同步一下数据库的数据，确保你看到的是真结果
        $fitnessClass->refresh();

        return response()->json($fitnessClass, 200);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->fitnessClassService->deleteClass($id);

        if (! $deleted) {
            return response()->json(['message' => 'Class not found or could not be deleted'], 404);
        }

        return response()->json(['message' => 'Class deleted successfully!'], 200);
    }
}
