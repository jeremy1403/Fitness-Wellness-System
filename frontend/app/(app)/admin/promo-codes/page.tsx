"use client";

import { useState, useEffect } from "react";
import { adminPromoApi, type PromoCode } from "@/lib/api/promo.api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit, Plus, Ticket, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type FormData = {
  code: string;
  discount_type: "fixed" | "percentage";
  discount_amount: string;
  max_discount_amount: string;
  is_new_user_only: boolean;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
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
};

export default function PromoCodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchPromos = async () => {
    try {
      setIsLoading(true);
      const data = await adminPromoApi.getAll();
      setPromos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

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
      max_discount_amount: promo.max_discount_amount != null ? String(promo.max_discount_amount) : "",
      is_new_user_only: promo.is_new_user_only,
      max_uses: promo.max_uses != null ? String(promo.max_uses) : "",
      expires_at: promo.expires_at ? promo.expires_at.split("T")[0] : "",
      is_active: promo.is_active,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!form.code.trim() || !form.discount_amount) {
      setFormError("Code and Discount Amount are required.");
      return;
    }

    const payload: Partial<PromoCode> = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_amount: parseFloat(form.discount_amount),
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      is_new_user_only: form.is_new_user_only,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
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
      setFormError(err?.errors?.code?.[0] ?? err?.message ?? "An error occurred. Please try again.");
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">
            Promo Codes &amp; Campaigns
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage discount codes, view usage, and track active promos.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="gap-2 shrink-0 bg-teal-600 hover:bg-teal-700 transition-all text-white"
        >
          <Plus className="w-4 h-4" />
          Create Promo
        </Button>
      </div>

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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No promo codes found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    promos.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className="font-mono font-semibold tracking-wide">
                          {promo.code}
                        </TableCell>
                        <TableCell>
                          {promo.discount_type === "percentage"
                            ? `${promo.discount_amount}%`
                            : `$${promo.discount_amount}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={promo.is_active ? "default" : "destructive"}
                            className={promo.is_active ? "bg-teal-500 hover:bg-teal-600" : ""}
                          >
                            {promo.is_active ? "Active" : "Inactive"}
                          </Badge>
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
                        <TableCell className="text-right space-x-2 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(promo)}
                            className="hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(promo.id)}
                            variant="ghost"
                            size="icon"
                            className="hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* ─── Create / Edit Modal ─── */}
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
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
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
                  onValueChange={(v) => setForm({ ...form, discount_type: v as "fixed" | "percentage" })}
                  disabled={isSaving}
                >
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discount-amount">
                  Amount {form.discount_type === "percentage" ? "(%)" : "($)"}
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
                  Max Discount Cap ($){" "}
                  <span className="text-xs text-slate-400 font-normal">— e.g. "20% off, capped at $50"</span>
                </Label>
                <Input
                  id="max-cap"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50.00"
                  value={form.max_discount_amount}
                  onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            )}

            {/* New Users Only toggle */}
            <div className="flex items-center gap-3">
              <input
                id="new-user-only"
                type="checkbox"
                checked={form.is_new_user_only}
                onChange={(e) => setForm({ ...form, is_new_user_only: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                disabled={isSaving}
              />
              <Label htmlFor="new-user-only" className="cursor-pointer select-none">
                New Users Only{" "}
                <span className="text-xs text-slate-400 font-normal">(accounts ≤ 30 days old)</span>
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
