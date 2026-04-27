<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Classes\StoreFitnessClassRequest; 
use App\Models\FitnessClass;
use App\Services\FitnessClassService;
use Illuminate\Http\JsonResponse;

class FitnessClassController extends Controller
{
    // Inject Service using constructor
    public function __construct(
        protected FitnessClassService $fitnessClassService
    ) {}

    public function index(): JsonResponse
    {
        // Data is retrieved through Service
        $classes = $this->fitnessClassService->getAllClasses();

        return response()->json($classes);
    }


    public function store(StoreFitnessClassRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        // Get the ID sent from the front end
        $frontendUserId = $request->input('user_id');

        if (!$frontendUserId) {
            return response()->json(['message' => 'Frontend failed to provide user_id'], 400);
        }

        $validatedData['created_by'] = $frontendUserId;

        $fitnessClass = $this->fitnessClassService->createClass($validatedData);

        return response()->json([
            'message' => 'Created successfully!',
            'data' => $fitnessClass,
        ], 201);
    }

    public function update(StoreFitnessClassRequest $request, int $id): JsonResponse
    {
        $fitnessClass = FitnessClass::find($id);
        if (!$fitnessClass) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        $data = $request->all(); 

        // Replace user_id with created_by
        if (isset($data['user_id'])) {
            $data['created_by'] = $data['user_id'];
            unset($data['user_id']); 
        }

        $fitnessClass->update($data);
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
