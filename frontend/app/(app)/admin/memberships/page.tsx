"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Users, Ban, Search, Plus, Pencil } from "lucide-react";
import { membershipApi, MembershipPlan } from "@/lib/api/membership.api";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

const emptyForm = {
  name: "",
  price: "",
  duration_days: "",
  booking_daily_limit: "",
  booking_advance_days: "",
  status: "active",
};

export default function AdminMembershipsPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      duration_days: String(plan.duration_days),
      booking_daily_limit: String(plan.booking_daily_limit),
      booking_advance_days: String(plan.booking_advance_days),
      status: plan.status,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        price: form.price,
        duration_days: parseInt(form.duration_days),
        booking_daily_limit: parseInt(form.booking_daily_limit),
        booking_advance_days: parseInt(form.booking_advance_days),
        status: form.status,
      };

      if (editingPlan) {
        await membershipApi.updatePlan(editingPlan.id, payload as any);
      } else {
        await membershipApi.createPlan(payload as any);
      }

      setShowModal(false);
      fetchData();
    } catch {
      setFormError("Failed to save plan. Please check your inputs.");
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = plans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Membership Plans</h1>
          <p className="mt-1 text-sm text-slate-500">Manage membership plans and subscriptions.</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Error */}
      {(loadError || actionError) && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{actionError ?? loadError}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => fetchData()} disabled={loading} className="border-red-200 bg-white text-red-700 hover:bg-red-100">
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
                  <p className="text-2xl font-semibold text-slate-900">{stats[key]}</p>
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
            <Input placeholder="Search plans..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 border-0 p-0 shadow-none focus-visible:ring-0" />
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium text-slate-900">{plan.name}</TableCell>
                    <TableCell className="text-slate-500">RM {plan.price}</TableCell>
                    <TableCell className="text-slate-500">{plan.duration_days} days</TableCell>
                    <TableCell className="text-slate-500">{plan.booking_daily_limit} bookings/day</TableCell>
                    <TableCell className="text-slate-500">{plan.booking_advance_days} days ahead</TableCell>
                    <TableCell>
                      <Badge className={plan.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(plan)} className="flex items-center gap-1">
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === plan.id}
                          onClick={() => toggleStatus(plan)}
                          className={plan.status === "active" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}
                        >
                          {actionLoading === plan.id ? "Updating..." : plan.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <Label>Plan Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basic" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Price (RM)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 29.99" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Duration (days)</Label>
              <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} placeholder="e.g. 30" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Daily Booking Limit</Label>
              <Input type="number" value={form.booking_daily_limit} onChange={(e) => setForm({ ...form, booking_daily_limit: e.target.value })} placeholder="e.g. 1" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Advance Booking Days</Label>
              <Input type="number" value={form.booking_advance_days} onChange={(e) => setForm({ ...form, booking_advance_days: e.target.value })} placeholder="e.g. 3" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={formLoading}>
                {formLoading ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}