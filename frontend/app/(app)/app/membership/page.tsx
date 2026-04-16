"use client";

import { useEffect, useState } from "react";
import { membershipApi, Membership, MembershipPlan } from "@/lib/api/membership.api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [plansRes, membershipRes] = await Promise.all([
        membershipApi.getPlans(),
        membershipApi.myMembership(),
      ]);
      setPlans(plansRes.data);
      setActiveMembership(membershipRes.data);
    } catch (err) {
      setMessage("Failed to load membership data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(planId: number) {
    setSubscribing(true);
    setMessage("");
    try {
      await membershipApi.subscribe(planId, "card_mock");
      setMessage("Successfully subscribed!");
      fetchData();
    } catch (err) {
      setMessage("Failed to subscribe. You may already have an active membership.");
    } finally {
      setSubscribing(false);
    }
  }

  async function handleCancel() {
    if (!activeMembership) return;
    if (!confirm("Are you sure you want to cancel your membership?")) return;
    try {
      await membershipApi.cancel(activeMembership.id);
      setMessage("Membership cancelled.");
      fetchData();
    } catch (err) {
      setMessage("Failed to cancel membership.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Membership</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your membership plan and subscription.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {/* Active Membership */}
      {activeMembership ? (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-green-900">
                Current Plan: {activeMembership.plan?.name}
              </h2>
              <p className="mt-1 text-sm text-green-700">
                Valid until: {new Date(activeMembership.end_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-green-700">
                Status:{" "}
                <Badge className="bg-green-100 text-green-800">
                  {activeMembership.status}
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
      ) : (
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-sm text-yellow-800">
            You don't have an active membership. Subscribe to a plan below.
          </p>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Available Plans
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col gap-4 p-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {plan.name}
                </h3>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  RM {plan.price}
                  <span className="text-sm font-normal text-slate-500">
                    /{plan.duration_days} days
                  </span>
                </p>
              </div>
              <ul className="flex flex-col gap-1 text-sm text-slate-600">
                <li>✓ Up to {plan.booking_daily_limit} bookings/day</li>
                <li>✓ Book up to {plan.booking_advance_days} days ahead</li>
              </ul>
              <Button
                className="mt-auto"
                disabled={subscribing || !!activeMembership}
                onClick={() => handleSubscribe(plan.id)}
              >
                {activeMembership ? "Already Subscribed" : "Subscribe"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}