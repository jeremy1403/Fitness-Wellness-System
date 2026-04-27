<?php

namespace App\Services;

use App\DTOs\Membership\SubscribeToPlanData;
use App\DTOs\Membership\UpdateSubscriptionData;
use App\Models\Membership;
use App\Repositories\Contracts\MembershipPlanRepositoryInterface;
use App\Repositories\Contracts\MembershipRepositoryInterface;
use App\Support\AppLogger;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use App\DTOs\Membership\CreatePlanData;

class MembershipService
{
    public function __construct(
        private readonly MembershipRepositoryInterface $membershipRepository,
        private readonly MembershipPlanRepositoryInterface $planRepository,
    ) {}

    // Get all available active plans (for members to browse)
    public function getActivePlans(): Collection
    {
        return $this->planRepository->getActive();
    }

    // Get all plans (for admin to manage)
    public function getAllPlans(): Collection
    {
        return $this->planRepository->all();
    }

    // Get a specific plan by ID
    public function getPlanById(int $planId)
    {
        $plan = $this->planRepository->findById($planId);
        if (!$plan) {
            throw new \Exception('Membership plan not found.');
        }
        return $plan;
    }

    // Get user's current active membership
    public function getActiveMembership(int $userId): ?Membership
    {
        return $this->membershipRepository->getActiveForUser($userId);
    }

    // Get all memberships for a user (history)
    public function getUserMemberships(int $userId): Collection
    {
        return $this->membershipRepository->findByUser($userId);
    }

    // Subscribe a user to a plan
    public function subscribe(SubscribeToPlanData $data): Membership
    {
        $plan = $this->planRepository->findById($data->planId);
        if (!$plan) {
            throw new \Exception('Membership plan not found.');
        }
        if (!$plan->isActive()) {
            throw new \Exception('This membership plan is not available.');
        }

        // Check if user already has an active or pending membership
        $existingMemberships = $this->membershipRepository->findByUser($data->userId);

        $blockingMembership = $existingMemberships->first(function ($membership) {
            return in_array($membership->status, ['active', 'pending']);
        });

        if ($blockingMembership) {
            throw new \Exception('You already have an active or pending membership. Please wait until it is approved, cancelled, or expired before choosing another package.');
        }

        $startDate = Carbon::today();
        $endDate = Carbon::today();

        return DB::transaction(function () use ($data, $plan, $startDate, $endDate) {
            $membership = $this->membershipRepository->create([
                'user_id'            => $data->userId,
                'membership_plan_id' => $plan->id,
                'start_date'         => $startDate,
                'end_date'           => $endDate,
                'status'             => 'pending',
            ]);

            AppLogger::info('membership', 'User subscribed to plan', [
                'user_id' => $data->userId,
                'plan_id' => $plan->id,
            ]);

            return $membership;
        });
    }

    // Cancel a membership
    public function cancel(int $membershipId, int $userId): Membership
    {
        $membership = $this->membershipRepository->findById($membershipId);

        if (!$membership) {
            throw new \Exception('Membership not found.');
        }

        if ($membership->user_id !== $userId) {
            throw new \Exception('Unauthorized.');
        }

        if (!in_array($membership->status, ['active', 'pending'])) {
            throw new \Exception('Only active or pending memberships can be cancelled.');
        }

        return DB::transaction(function () use ($membership) {
            $updatedMembership = $this->membershipRepository->update($membership, [
                'status' => 'cancelled',
            ]);

            $pendingPayment = $membership->payments()
                ->where('status', 'pending')
                ->latest('id')
                ->first();

            if ($pendingPayment) {
                $pendingPayment->update([
                    'status' => 'cancelled',
                ]);
            }

            AppLogger::info('membership', 'Membership cancelled', [
                'membership_id' => $membership->id,
                'user_id' => $membership->user_id,
                'cancelled_payment_id' => $pendingPayment?->id,
            ]);

            return $updatedMembership;
        });
    }

    // Update subscription status (admin use)
    public function updateStatus(int $membershipId, UpdateSubscriptionData $data): Membership
    {
        $membership = $this->membershipRepository->findById($membershipId);
        if (!$membership) {
            throw new \Exception('Membership not found.');
        }

        return $this->membershipRepository->update($membership, [
            'status' => $data->status,
        ]);
    }

    // Create a new plan
    public function createPlan(CreatePlanData $data)
    {
        return $this->planRepository->create([
            'tier_name'            => $data->tierName,
            'billing_cycle'        => $data->billingCycle,
            'price'                => $data->price,
            'booking_daily_limit'  => $data->bookingDailyLimit,
            'booking_advance_days' => $data->bookingAdvanceDays,
            'status'               => $data->status,
        ]);
    }

    // Update an existing plan
    public function updatePlan(int $planId, CreatePlanData $data)
    {
        $plan = $this->planRepository->findById($planId);
        if (!$plan) {
            throw new \Exception('Plan not found.');
        }
        $plan->update([
            'tier_name'            => $data->tierName,
            'billing_cycle'        => $data->billingCycle,
            'price'                => $data->price,
            'booking_daily_limit'  => $data->bookingDailyLimit,
            'booking_advance_days' => $data->bookingAdvanceDays,
            'status'               => $data->status,
        ]);
        return $plan->fresh();
    }
}
