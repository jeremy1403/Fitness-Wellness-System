<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TrainerResource;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    public function index(): JsonResponse
    {
        $users = $this->userService->getAllUsers()->load('roles');

        return response()->json([
            'data' => UserResource::collection($users),
        ]);
    }

    public function trainers(): JsonResponse
    {
        $trainers = $this->userService->getAllActiveTrainers();

        return response()->json([
            'data' => TrainerResource::collection($trainers),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getUserById($id);

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        return response()->json([
            'data' => new UserResource($user->load('roles')),
        ]);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => $this->userService->getStatusCounts(),
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:active,disabled'],
        ]);

        $user = $this->userService->getUserById($id);

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $updated = $this->userService->updateStatus($user, $request->input('status'));

        return response()->json([
            'message' => 'User status updated.',
            'data' => new UserResource($updated->load('roles')),
        ]);
    }

    public function assignRole(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'role' => ['required', 'string', 'in:admin,trainer,member'],
        ]);

        $user = $this->userService->getUserById($id);

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $this->userService->assignRole($user, $request->input('role'));

        return response()->json([
            'message' => 'Role assigned successfully.',
            'data' => new UserResource($user->load('roles')),
        ]);
    }

    public function removeRole(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'role' => ['required', 'string', 'in:admin,trainer,member'],
        ]);

        $user = $this->userService->getUserById($id);

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $this->userService->removeRole($user, $request->input('role'));

        return response()->json([
            'message' => 'Role removed successfully.',
            'data' => new UserResource($user->load('roles')),
        ]);
    }
}
