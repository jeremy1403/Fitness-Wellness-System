"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Users, Ban, Search } from "lucide-react";
import { membershipApi, Membership, MembershipPlan } from "@/lib/api/membership.api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statCards = [
  { key: "total" as const, label: "Total Plans", icon: CreditCard, color: "text-slate-600" },
  { key: "active" as const, label: "Active Plans", icon: Users, color: "text-emerald-600" },
  { key: "inactive" as const, label: "Inactive Plans", icon: Ban, color: "text-red-500" },
];

export default function AdminMembershipsPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.status === "active").length,
    inactive: plans.filter((p) => p.status !== "active").length,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const plansRes = await membershipApi.getAllPlans();
      setPlans(plansRes.data);
    } catch {
      setLoadError("Unable to load membership plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleStatus = async (plan: MembershipPlan) => {
    const newStatus = plan.status === "active" ? "inactive" : "active";
    setActionLoading(plan.id);
    setActionError(null);
    try {
      await membershipApi.updatePlanStatus(plan.id, newStatus);
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, status: newStatus } : p))
      );
    } catch {
      setActionError("Unable to update plan status.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = plans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Membership Plans
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage membership plans and subscriptions.
        </p>
      </div>

      {/* Error */}
      {(loadError || actionError) && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{actionError ?? loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
          >
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg bg-slate-100 p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : (
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats[key]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </div>

          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              {search ? "No plans match your search." : "No plans found."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Daily Limit</TableHead>
                  <TableHead>Advance Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium text-slate-900">
                      {plan.name}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      RM {plan.price}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {plan.duration_days} days
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {plan.booking_daily_limit} bookings/day
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {plan.booking_advance_days} days ahead
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          plan.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === plan.id}
                        onClick={() => toggleStatus(plan)}
                        className={
                          plan.status === "active"
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }
                      >
                        {actionLoading === plan.id
                          ? "Updating..."
                          : plan.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}