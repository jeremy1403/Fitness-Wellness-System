"use client";

import { useState, useEffect } from "react";
import { adminPromoApi, type PromoCode } from "@/lib/api/promo.api";
import { membershipApi, type MembershipPlan } from "@/lib/api/membership.api";
import { adminApi } from "@/lib/api/admin.api";
import type { User as ApiUser } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Edit,
  Plus,
  Ticket,
  Loader2,
  AlertCircle,
  CheckCircle2,
  History,
  User,
  Clock,
  Lock,
  Infinity,
  ArrowUpDown,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";

// ── KPI Stat Card ──────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, bg }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; bg: string;
}) {
  return (
    <Card className={`border-none shadow-lg ${bg}`}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-white/60 backdrop-blur">{icon}</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="text-3xl font-extrabold text-slate-800 leading-tight">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type SortOption = "newest" | "expiring_soon" | "most_used";

const SORT_LABELS: Record<SortOption, string> = {
  newest:        "Newest First",
  expiring_soon: "Expiring Soon",
  most_used:     "Most Used",
};

type FormData = {
  code: string;
  discount_type: "fixed" | "percentage";
  discount_amount: string;
  max_discount_amount: string;
  is_new_user_only: boolean;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
  required_tier: string; // "" = no restriction
  min_spend_amount: string;
  is_targeted: boolean;
  target_user_ids: number[];
};

type HistoryEntry = {
  user_id: number;
  name: string;
  email: string;
  used_at: string;
};

const defaultForm: FormData = {
  code: "",
  discount_type: "fixed",
  discount_amount: "",
  max_discount_amount: "",
  is_new_user_only: false,
  max_uses: "",
  expires_at: "",
  is_active: true,
  required_tier: "",
  min_spend_amount: "",
  is_targeted: false,
  target_user_ids: [],
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PromoCodesPage() {
  const [promos, setPromos]               = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [sortBy, setSortBy]               = useState<SortOption>("newest");
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingPromo, setEditingPromo]   = useState<PromoCode | null>(null);
  const [form, setForm]                   = useState<FormData>(defaultForm);
  const [isSaving, setIsSaving]           = useState(false);
  const [formError, setFormError]         = useState<string | null>(null);
  const [formSuccess, setFormSuccess]     = useState<string | null>(null);

  // ── Optimistic toggle state: promoId → loading ──────────────────────────
  const [togglingId, setTogglingId]       = useState<number | null>(null);

  // ── History Sheet ────────────────────────────────────────────────────────
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [historyPromo, setHistoryPromo]         = useState<PromoCode | null>(null);
  const [historyEntries, setHistoryEntries]     = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading]     = useState(false);
  const [historyError, setHistoryError]         = useState<string | null>(null);

  // ── Membership Plans (consumed from Member 4 for tier-restriction modal) ─
  const [plans, setPlans]                 = useState<MembershipPlan[]>([]);
  const [users, setUsers]                 = useState<ApiUser[]>([]);

  const fetchPromos = async (sort: SortOption = sortBy) => {
    try {
      setIsLoading(true);
      const data = await adminPromoApi.getAll(sort);
      setPromos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch whenever sort changes; also fetch membership plans once
  useEffect(() => {
    fetchPromos(sortBy);
    membershipApi.getPlans()
      .then((res) => setPlans(res.data))
      .catch(() => {});
    adminApi.getUsers()
      .then((res) => setUsers(res.data.filter((u) => u.roles.includes("member"))))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // ── Modal helpers ────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingPromo(null);
    setForm(defaultForm);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (promo: PromoCode) => {
    setEditingPromo(promo);
    setForm({
      code: promo.code,
      discount_type: promo.discount_type as "fixed" | "percentage",
      discount_amount: String(promo.discount_amount),
      max_discount_amount:
        promo.max_discount_amount != null ? String(promo.max_discount_amount) : "",
      is_new_user_only: promo.is_new_user_only,
      max_uses: promo.max_uses != null ? String(promo.max_uses) : "",
      expires_at: promo.expires_at ? promo.expires_at.split("T")[0] : "",
      is_active: promo.is_active,
      required_tier: promo.required_tier != null ? promo.required_tier : "",
      min_spend_amount: promo.min_spend_amount != null && promo.min_spend_amount !== 0 ? String(promo.min_spend_amount) : "",
      is_targeted: promo.is_targeted ?? false,
      target_user_ids: promo.target_users?.map((u) => u.id) ?? [],
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // ── Quick toggle ─────────────────────────────────────────────────────────

  const handleToggleActive = async (promo: PromoCode) => {
    setTogglingId(promo.id);
    // Optimistic UI update
    setPromos((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, is_active: !p.is_active } : p))
    );
    try {
      await adminPromoApi.toggleActive(promo.id);
    } catch {
      // Revert on failure
      setPromos((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, is_active: promo.is_active } : p))
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ── History Sheet ────────────────────────────────────────────────────────

  const openHistorySheet = async (promo: PromoCode) => {
    setHistoryPromo(promo);
    setHistoryEntries([]);
    setHistoryError(null);
    setHistorySheetOpen(true);
    setHistoryLoading(true);
    try {
      const res = await adminPromoApi.getHistory(promo.id);
      setHistoryEntries(res.history);
    } catch (err: any) {
      setHistoryError(err?.message ?? "Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Form submit ──────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!form.code.trim() || !form.discount_amount) {
      setFormError("Code and Discount Amount are required.");
      return;
    }

    const payload: Partial<PromoCode> & { target_user_ids?: number[] } = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_amount: parseFloat(form.discount_amount),
      max_discount_amount: form.max_discount_amount
        ? parseFloat(form.max_discount_amount)
        : null,
      is_new_user_only: form.is_new_user_only,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
      required_tier: form.required_tier ? form.required_tier : null,
      min_spend_amount: form.min_spend_amount ? parseFloat(form.min_spend_amount) : 0,
      is_targeted: form.is_targeted,
      target_user_ids: form.is_targeted ? form.target_user_ids : [],
    };

    try {
      setIsSaving(true);
      if (editingPromo) {
        await adminPromoApi.update(editingPromo.id, payload);
        setFormSuccess("Promo code updated successfully!");
      } else {
        await adminPromoApi.create(payload);
        setFormSuccess("Promo code created successfully!");
      }
      await fetchPromos();
      setTimeout(() => setIsModalOpen(false), 900);
    } catch (err: any) {
      setFormError(
        err?.errors?.code?.[0] ?? err?.message ?? "An error occurred. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await adminPromoApi.delete(id);
      fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">
            Promo Codes &amp; Campaigns
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage discount codes, view usage, and track active promos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* ── Sort Dropdown ── */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={openCreateModal}
            className="gap-2 shrink-0 bg-teal-600 hover:bg-teal-700 transition-all text-white"
          >
            <Plus className="w-4 h-4" />
            Create Promo
          </Button>
        </div>
      </div>

      {/* ── Global ROI Dashboard ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            icon={<Users className="w-6 h-6 text-teal-600" />}
            label="Total Redemptions"
            value={promos.reduce((sum, p) => sum + p.times_used, 0)}
            sub="Across all campaigns"
            bg="bg-teal-50"
          />
          <KpiCard
            icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
            label="Total Subsidized"
            value={`RM ${promos.reduce((sum, p) => sum + (p.discount_type === 'fixed' ? Number(p.discount_amount) * p.times_used : 0), 0).toFixed(2)}`}
            sub="Estimate (Fixed discounts only)"
            bg="bg-emerald-50"
          />
          <KpiCard
            icon={<TrendingUp className="w-6 h-6 text-violet-600" />}
            label="Active Campaigns"
            value={promos.filter(p => p.is_active && (!p.expires_at || new Date(p.expires_at) >= new Date())).length}
            sub="Currently running promos"
            bg="bg-violet-50"
          />
        </div>
      )}


      <Card className="border-none shadow-xl shadow-teal-900/5 bg-white/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-teal-600" /> Active Campaigns
          </CardTitle>
          <CardDescription>
            All valid and inactive discount rules enforcing proxy validation limits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col space-y-3">
              <Skeleton className="h-[40px] w-full rounded-xl" />
              <Skeleton className="h-[40px] w-full rounded-xl" />
              <Skeleton className="h-[40px] w-full rounded-xl" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    {/* ── NEW: Max Cap column ── */}
                    <TableHead>Max Cap</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage Limit</TableHead>
                    <TableHead>Times Used</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promos.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No promo codes found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    promos.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className="font-mono font-semibold tracking-wide">
                          {promo.code}
                          {promo.is_targeted && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md px-1.5 py-0.5">
                                🎯 Targeted ({promo.target_users?.length ?? 0} Users)
                              </span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {promo.discount_type === "percentage"
                            ? `${promo.discount_amount}%`
                            : `RM ${promo.discount_amount}`}
                          {Number(promo.min_spend_amount) > 0 && (
                            <div className="mt-1">
                              <span className="text-xs text-slate-500 whitespace-nowrap">
                                Min RM {promo.min_spend_amount}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* ── Max Cap cell ── */}
                        <TableCell>
                          {promo.discount_type === "percentage" &&
                          promo.max_discount_amount != null ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              <Lock className="w-3 h-3" />
                              RM {promo.max_discount_amount}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Infinity className="w-3.5 h-3.5" /> No cap
                            </span>
                          )}
                        </TableCell>

                        {/* ── Quick Active Toggle Switch ── */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`toggle-${promo.id}`}
                              checked={promo.is_active}
                              disabled={togglingId === promo.id}
                              onCheckedChange={() => handleToggleActive(promo)}
                              className="data-[state=checked]:bg-teal-500"
                            />
                            <span
                              className={`text-xs font-medium ${
                                promo.is_active ? "text-teal-600" : "text-slate-400"
                              }`}
                            >
                              {togglingId === promo.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : promo.is_active ? (
                                "Active"
                              ) : (
                                "Inactive"
                              )}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>{promo.max_uses ?? "Unlimited"}</TableCell>
                        <TableCell className="font-semibold text-slate-700">
                          {promo.times_used}
                        </TableCell>
                        <TableCell>
                          {promo.expires_at
                            ? new Date(promo.expires_at).toLocaleDateString()
                            : "Never"}
                        </TableCell>

                        {/* ── Actions: Edit + History + Delete ── */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* View History */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openHistorySheet(promo)}
                              className="hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="View Redemption History"
                            >
                              <History className="w-4 h-4" />
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(promo)}
                              className="hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Promo"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            {/* Delete */}
                            <Button
                              onClick={() => handleDelete(promo.id)}
                              variant="ghost"
                              size="icon"
                              className="hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Promo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Redemption History Sheet ────────────────────────────────────────── */}
      <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              Redemption History
            </SheetTitle>
            <SheetDescription>
              {historyPromo ? (
                <>
                  Users who redeemed{" "}
                  <span className="font-mono font-bold text-slate-800">
                    {historyPromo.code}
                  </span>
                </>
              ) : (
                "Loading…"
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {historyLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : historyError ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {historyError}
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                <Ticket className="w-10 h-10 opacity-20" />
                <p className="font-medium">No redemptions yet</p>
                <p className="text-sm">
                  This code hasn&apos;t been used by any member yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  {historyEntries.length} redemption
                  {historyEntries.length !== 1 ? "s" : ""}
                </p>
                {historyEntries.map((entry) => (
                  <div
                    key={entry.user_id}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {entry.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{entry.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      {entry.used_at
                        ? new Date(entry.used_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Create / Edit Modal ─────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-teal-600" />
              {editingPromo ? "Edit Promo Code" : "Create Promo Code"}
            </DialogTitle>
            <DialogDescription>
              {editingPromo
                ? `Editing "${editingPromo.code}". Changes apply immediately.`
                : "Fill in the fields below to create a new discount campaign."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Code */}
            <div className="space-y-1.5">
              <Label htmlFor="promo-code">Code</Label>
              <Input
                id="promo-code"
                placeholder="e.g. SUMMER20"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                className="font-mono uppercase tracking-widest"
                disabled={isSaving}
              />
            </div>

            {/* Discount Type + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="discount-type">Discount Type</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) =>
                    setForm({ ...form, discount_type: v as "fixed" | "percentage" })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (RM)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discount-amount">
                  Amount {form.discount_type === "percentage" ? "(%)" : "(RM)"}
                </Label>
                <Input
                  id="discount-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={form.discount_type === "percentage" ? "e.g. 20" : "e.g. 50.00"}
                  value={form.discount_amount}
                  onChange={(e) => setForm({ ...form, discount_amount: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Min Spend */}
            <div className="space-y-1.5">
              <Label htmlFor="min-spend">Minimum Spend (RM)</Label>
              <Input
                id="min-spend"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 50.00 (leave 0 for no minimum)"
                value={form.min_spend_amount}
                onChange={(e) => setForm({ ...form, min_spend_amount: e.target.value })}
                disabled={isSaving}
              />
            </div>

            {/* Max Uses + Expires At */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="max-uses">Max Uses (blank = unlimited)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expires-at">Expires At (optional)</Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Max Cap (only relevant for percentage) */}
            {form.discount_type === "percentage" && (
              <div className="space-y-1.5">
                <Label htmlFor="max-cap">
                  Max Discount Cap (RM){" "}
                  <span className="text-xs text-slate-400 font-normal">
                    — e.g. &quot;20% off, capped at RM 50&quot;
                  </span>
                </Label>
                <Input
                  id="max-cap"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50.00"
                  value={form.max_discount_amount}
                  onChange={(e) =>
                    setForm({ ...form, max_discount_amount: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>
            )}

            {/* Required Membership Tier (STEP 4 — consumes Member 4 plans) */}
            <div className="space-y-1.5">
              <Label htmlFor="required-plan">
                Required Membership Tier{" "}
                <span className="text-xs text-slate-400 font-normal">
                  — leave blank for all members
                </span>
              </Label>
              <Select
                value={form.required_tier || "none"}
                onValueChange={(v) => setForm({ ...form, required_tier: v === "none" ? "" : v })}
                disabled={isSaving}
              >
                <SelectTrigger id="required-plan">
                  <SelectValue placeholder="Open to all tiers…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-slate-400">— No restriction (all members)</span>
                  </SelectItem>
                  <SelectItem value="basic">
                    👑 Basic
                  </SelectItem>
                  <SelectItem value="premium">
                    👑 Premium
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Targeted Toggle & Users */}
            <div className="space-y-3 pt-2 border-t mt-4">
              <div className="flex items-center gap-3">
                <input
                  id="is-targeted"
                  type="checkbox"
                  checked={form.is_targeted}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm({ ...form, is_targeted: checked, target_user_ids: checked ? form.target_user_ids : [] });
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={isSaving}
                />
                <Label htmlFor="is-targeted" className="cursor-pointer select-none">
                  🎯 Targeted Voucher
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    (Limit redemption to specific members)
                  </span>
                </Label>
              </div>

              {form.is_targeted && (
                <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Select Target Users</p>
                  {users.length === 0 ? (
                    <p className="text-xs text-slate-400">No members found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            checked={form.target_user_ids.includes(user.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm((prev) => ({
                                ...prev,
                                target_user_ids: checked
                                  ? [...prev.target_user_ids, user.id]
                                  : prev.target_user_ids.filter((id) => id !== user.id),
                              }));
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            disabled={isSaving}
                          />
                          <Label htmlFor={`user-${user.id}`} className="text-xs cursor-pointer truncate">
                            {user.name} <span className="text-slate-400">({user.email})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* New Users Only toggle */}
            <div className="flex items-center gap-3 pt-2">
              <input
                id="new-user-only"
                type="checkbox"
                checked={form.is_new_user_only}
                onChange={(e) =>
                  setForm({ ...form, is_new_user_only: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                disabled={isSaving}
              />
              <Label htmlFor="new-user-only" className="cursor-pointer select-none">
                New Users Only{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (accounts ≤ 30 days old)
                </span>
              </Label>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 pt-1">
              <input
                id="is-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                disabled={isSaving}
              />
              <Label htmlFor="is-active" className="cursor-pointer select-none">
                Mark as Active
              </Label>
            </div>

            {/* Feedback */}
            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {formSuccess}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : editingPromo ? (
                  "Save Changes"
                ) : (
                  "Create Promo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
