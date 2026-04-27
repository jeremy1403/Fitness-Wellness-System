<?php

namespace App\Http\Controllers\Api;

use App\DTOs\Membership\SubscribeToPlanData;
use App\DTOs\Membership\UpdateSubscriptionData;
use App\DTOs\Membership\CreatePlanData;
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
    public function getPlans(): JsonResponse
    {
        $plans = $this->membershipService->getActivePlans();
        return response()->json([
            'message' => 'Plans retrieved successfully.',
            'data'    => $plans,
        ]);
    }

    // GET /api/v1/memberships/plans/all
    public function getAllPlans(): JsonResponse
    {
        $plans = $this->membershipService->getAllPlans();
        return response()->json([
            'message' => 'All plans retrieved successfully.',
            'data'    => $plans,
        ]);
    }

    // GET /api/v1/memberships/my
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
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id'        => 'required|integer|exists:membership_plans,id',
            'payment_method' => 'required|string|in:cash,transfer,card_mock',
        ]);

        $membership = $this->membershipService->subscribe(
            new SubscribeToPlanData(
                userId:        $request->user()->id,
                planId:        $request->plan_id,
                paymentMethod: $request->payment_method,
            )
        );

        return response()->json([
            'message' => 'Successfully subscribed to plan.',
            'data'    => $membership->load('plan'),
        ], 201);
    }

    // PUT /api/v1/memberships/{id}/cancel
    public function cancel(Request $request, int $id): JsonResponse
    {
        $membership = $this->membershipService->cancel($id, $request->user()->id);
        return response()->json([
            'message' => 'Membership cancelled successfully.',
            'data'    => $membership,
        ]);
    }

    // PUT /api/v1/memberships/{id}/status
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:active,inactive,pending,expired,cancelled',
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
    public function createPlan(Request $request): JsonResponse
    {
        $request->validate([
            'tier_name'            => 'required|string|in:basic,premium',
            'billing_cycle'        => 'required|string|in:monthly,biannually,annually',
            'price'                => 'required|numeric|min:0',
            'daily_free_quota'     => 'required|integer|min:0',
            'max_daily_bookings'   => 'nullable|integer|min:1',
            'booking_advance_days' => 'required|integer|min:1',
            'status'               => 'sometimes|string|in:active,inactive',
        ]);

        $plan = $this->membershipService->createPlan(
            new CreatePlanData(
                tierName:           $request->tier_name,
                billingCycle:       $request->billing_cycle,
                price:              $request->price,
                dailyFreeQuota:     $request->daily_free_quota,
                maxDailyBookings:   $request->max_daily_bookings,
                bookingAdvanceDays: $request->booking_advance_days,
                status:             $request->status ?? 'active',
            )
        );

        return response()->json([
            'message' => 'Plan created successfully.',
            'data'    => $plan,
        ], 201);
    }

    // PUT /api/v1/memberships/plans/{id}
    public function updatePlan(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'tier_name'            => 'required|string|in:basic,premium',
            'billing_cycle'        => 'required|string|in:monthly,biannually,annually',
            'price'                => 'required|numeric|min:0',
            'daily_free_quota'     => 'required|integer|min:0',
            'max_daily_bookings'   => 'nullable|integer|min:1',
            'booking_advance_days' => 'required|integer|min:1',
            'status'               => 'sometimes|string|in:active,inactive',
        ]);

        $plan = $this->membershipService->updatePlan(
            (int) $id,
            new CreatePlanData(
                tierName:           $request->tier_name,
                billingCycle:       $request->billing_cycle,
                price:              $request->price,
                dailyFreeQuota:     $request->daily_free_quota,
                maxDailyBookings:   $request->max_daily_bookings,
                bookingAdvanceDays: $request->booking_advance_days,
                status:             $request->status ?? 'active',
            )
        );

        return response()->json([
            'message' => 'Plan updated successfully.',
            'data'    => $plan,
        ]);
    }
}