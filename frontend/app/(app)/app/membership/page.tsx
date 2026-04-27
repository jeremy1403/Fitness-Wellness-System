"use client";

import { useEffect, useState } from "react";
import { membershipApi, Membership, MembershipPlan } from "@/lib/api/membership.api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [currentMembership, setCurrentMembership] = useState<Membership | null>(null);
  const [historyMemberships, setHistoryMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");

    if (success === "payment") {
      setMessage("Payment successful. Your membership has been activated.");
    }
  }, []);

  async function fetchData() {
    try {
      const [plansRes, membershipRes, historyRes] = await Promise.all([
        membershipApi.getPlans(),
        membershipApi.myMembership(),
        membershipApi.myHistory(),
      ]);

      setPlans(plansRes.data);
      setHistoryMemberships(historyRes.data);

      const activeMembership = membershipRes.data;

      if (activeMembership) {
        setCurrentMembership(activeMembership);
      } else {
        const pendingMembership =
          [...historyRes.data]
            .filter((m) => m.status === "pending")
            .sort(
              (a, b) =>
                new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
            )[0] ?? null;

        setCurrentMembership(pendingMembership);
      }
    } catch {
      setMessage("Failed to load membership data.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubscribe(planId: number) {
    window.location.href = `/app/payments?plan_id=${planId}`;
  }

  async function handleCancel() {
    if (!currentMembership) return;
    if (!confirm("Are you sure you want to cancel your membership?")) return;

    try {
      await membershipApi.cancel(currentMembership.id);
      setMessage("Membership cancelled.");
      await fetchData();
    } catch {
      setMessage("Failed to cancel membership.");
    }
  }

  const hasBlockingMembership =
    currentMembership?.status === "active" || currentMembership?.status === "pending";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Membership</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your membership plan and subscription.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {currentMembership?.status === "active" && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-green-900">
                Current Plan: <span className="capitalize">{currentMembership.plan?.tier_name ? `${currentMembership.plan.tier_name} Tier` : "Membership"}</span>
              </h2>
              <p className="mt-1 text-sm text-green-700">
                Valid until: {new Date(currentMembership.end_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-green-700">
                Status{" "}
                <Badge className="bg-green-100 text-green-800">
                  {currentMembership.status}
                </Badge>
              </p>
            </div>

            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={handleCancel}
            >
              Cancel Membership
            </Button>
          </div>
        </div>
      )}

      {currentMembership?.status === "pending" && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-amber-900">
                Pending Membership: <span className="capitalize">{currentMembership.plan?.tier_name ? `${currentMembership.plan.tier_name} Tier` : "Membership"}</span>
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                You already selected a package and your payment is awaiting admin confirmation.
                You cannot choose another package until this one is approved, cancelled, or expired.
              </p>
              <p className="mt-2 text-sm text-amber-800">
                Status{" "}
                <Badge className="bg-amber-100 text-amber-800">
                  {currentMembership.status}
                </Badge>
              </p>
            </div>

            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={handleCancel}
            >
              Cancel Pending Membership
            </Button>
          </div>
        </div>
      )}

      {!currentMembership && (
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-sm text-yellow-800">
            You don&apos;t have an active membership. Subscribe to a plan below.
          </p>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Available Plans
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col gap-4 p-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  <span className="capitalize">{plan.tier_name} Tier</span>
                </h3>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  RM {plan.price}
                  <span className="text-sm font-normal text-slate-500 capitalize">
                    /{plan.billing_cycle}
                  </span>
                </p>
              </div>

              <ul className="flex flex-col gap-1 text-sm text-slate-600">
                <li>✓ Up to {plan.booking_daily_limit} bookings/day</li>
                <li>✓ Book up to {plan.booking_advance_days} days ahead</li>
              </ul>

              <Button
                className="mt-auto"
                disabled={hasBlockingMembership}
                onClick={() => handleSubscribe(plan.id)}
              >
                {currentMembership?.status === "active"
                  ? "You Already Have a Package"
                  : currentMembership?.status === "pending"
                    ? "Waiting for Approval"
                    : "Proceed to Payment"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}