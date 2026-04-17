<?php

namespace App\Http\Controllers\Api;

use App\DTOs\Membership\SubscribeToPlanData;
use App\DTOs\Membership\UpdateSubscriptionData;
use App\Http\Controllers\Controller;
use App\Services\MembershipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    public function __construct(
        private readonly MembershipService $membershipService,
    ) {}

    // GET /api/v1/memberships/plans
    // Returns all active plans (for members to browse)
    public function getPlans(): JsonResponse
    {
        $plans = $this->membershipService->getActivePlans();
        return response()->json([
            'message' => 'Plans retrieved successfully.',
            'data'    => $plans,
        ]);
    }

    // GET /api/v1/memberships/plans/all
    // Returns all plans (for admin)
    public function getAllPlans(): JsonResponse
    {
        $plans = $this->membershipService->getAllPlans();
        return response()->json([
            'message' => 'All plans retrieved successfully.',
            'data'    => $plans,
        ]);
    }

    // GET /api/v1/memberships/my
    // Returns current user's active membership
    public function myMembership(Request $request): JsonResponse
    {
        $membership = $this->membershipService->getActiveMembership(
            $request->user()->id
        );
        return response()->json([
            'message' => 'Active membership retrieved.',
            'data'    => $membership,
        ]);
    }

    // GET /api/v1/memberships/history
    // Returns all memberships for current user
    public function myHistory(Request $request): JsonResponse
    {
        $memberships = $this->membershipService->getUserMemberships(
            $request->user()->id
        );
        return response()->json([
            'message' => 'Membership history retrieved.',
            'data'    => $memberships,
        ]);
    }

    // POST /api/v1/memberships/subscribe
    // Subscribe current user to a plan
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id'        => 'required|integer|exists:membership_plans,id',
            'payment_method' => 'required|string|in:cash,transfer,card_mock',
        ]);

        $membership = $this->membershipService->subscribe(
            new SubscribeToPlanData(
                userId: $request->user()->id,
                planId: $request->plan_id,
                paymentMethod: $request->payment_method,
            )
        );

        return response()->json([
            'message' => 'Successfully subscribed to plan.',
            'data'    => $membership->load('plan'),
        ], 201);
    }

    // PUT /api/v1/memberships/{id}/cancel
    // Cancel a membership
    public function cancel(Request $request, int $id): JsonResponse
    {
        $membership = $this->membershipService->cancel($id, $request->user()->id);
        return response()->json([
            'message' => 'Membership cancelled successfully.',
            'data'    => $membership,
        ]);
    }

    // PUT /api/v1/memberships/{id}/status
    // Admin only - update membership status
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:active,inactive,expired,cancelled',
        ]);

        $membership = $this->membershipService->updateStatus(
            $id,
            new UpdateSubscriptionData(status: $request->status)
        );

        return response()->json([
            'message' => 'Membership status updated.',
            'data'    => $membership,
        ]);
    }

    // GET /api/v1/memberships/status
    // Returns subscription status (exposed for other modules to consume)
    public function getSubscriptionStatus(Request $request): JsonResponse
    {
        $membership = $this->membershipService->getActiveMembership(
            $request->user()->id
        );

        return response()->json([
            'message' => 'Subscription status retrieved.',
            'data'    => [
                'is_active'  => $membership !== null,
                'membership' => $membership,
            ],
        ]);
    }

    // PUT /api/v1/memberships/plans/{id}/status
    // Admin only - update plan status
    public function updatePlanStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:active,inactive',
        ]);

        $plan = $this->membershipService->getPlanById((int) $id);

        $plan->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Plan status updated.',
            'data'    => $plan->fresh(),
        ]);
    }

    // POST /api/v1/memberships/plans
    // Admin only - create a new plan
    public function createPlan(Request $request): JsonResponse
    {
        $request->validate([
            'name'                 => 'required|string|unique:membership_plans,name',
            'price'                => 'required|numeric|min:0',
            'duration_days'        => 'required|integer|min:1',
            'booking_daily_limit'  => 'required|integer|min:1',
            'booking_advance_days' => 'required|integer|min:1',
            'status'               => 'sometimes|string|in:active,inactive',
        ]);

        $plan = $this->membershipService->createPlan(
            new CreatePlanData(
                name: $request->name,
                price: $request->price,
                durationDays: $request->duration_days,
                bookingDailyLimit: $request->booking_daily_limit,
                bookingAdvanceDays: $request->booking_advance_days,
                status: $request->status ?? 'active',
            )
        );

        return response()->json([
            'message' => 'Plan created successfully.',
            'data'    => $plan,
        ], 201);
    }

    // PUT /api/v1/memberships/plans/{id}
    // Admin only - update a plan
    public function updatePlan(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'name'                 => 'required|string',
            'price'                => 'required|numeric|min:0',
            'duration_days'        => 'required|integer|min:1',
            'booking_daily_limit'  => 'required|integer|min:1',
            'booking_advance_days' => 'required|integer|min:1',
            'status'               => 'sometimes|string|in:active,inactive',
        ]);

        $plan = $this->membershipService->updatePlan(
            (int) $id,
            new CreatePlanData(
                name: $request->name,
                price: $request->price,
                durationDays: $request->duration_days,
                bookingDailyLimit: $request->booking_daily_limit,
                bookingAdvanceDays: $request->booking_advance_days,
                status: $request->status ?? 'active',
            )
        );

        return response()->json([
            'message' => 'Plan updated successfully.',
            'data'    => $plan,
        ]);
    }
}
