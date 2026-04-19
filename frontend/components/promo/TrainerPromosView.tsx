"use client";

import { useState, useEffect, useCallback } from "react";
import { trainerPromoApi, type PromoCode, type KpiData } from "@/lib/api/promo.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { User } from "@/types/auth";
import {
  Ticket, Plus, Trash2, Edit, Loader2, TrendingUp, Users,
  DollarSign, Star, AlertCircle, CheckCircle2, Trophy,
} from "lucide-react";

// ─── Tier colour map ───────────────────────────────────────────────────────
const TIER_STYLES: Record<string, { bar: string; badge: string }> = {
  teal:   { bar: "bg-teal-500",   badge: "bg-teal-100 text-teal-800"   },
  orange: { bar: "bg-orange-500", badge: "bg-orange-100 text-orange-800" },
  slate:  { bar: "bg-slate-400",  badge: "bg-slate-100 text-slate-700"  },
  yellow: { bar: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-800" },
  amber:  { bar: "bg-amber-500",  badge: "bg-amber-100 text-amber-800"  },
};

// ─── KPI Stat Card ─────────────────────────────────────────────────────────
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

// ─── KPI Progress Card ─────────────────────────────────────────────────────
function KpiProgressCard({ kpi }: { kpi: KpiData }) {
  const tier   = kpi.kpi_tier;
  const styles = TIER_STYLES[tier.color] ?? TIER_STYLES.teal;
  return (
    <Card className="border-none shadow-xl col-span-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-slate-600">KPI Performance Tier</p>
              <p className="text-2xl font-extrabold text-slate-800">{kpi.kpi_score} pts</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${styles.badge}`}>{tier.label}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Progress to next tier</span>
            {tier.next_at ? <span>{kpi.kpi_score} / {tier.next_at} pts</span> : <span>🏆 Maximum tier reached!</span>}
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${styles.bar}`}
              style={{ width: `${tier.next_at ? Math.min(tier.progress, 100) : 100}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Each code redemption earns <strong>10 KPI points</strong>. Tiers: Starter → Bronze → Silver → Gold → Elite
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Form types ────────────────────────────────────────────────────────────
type FormData = {
  code: string;
  discount_type: "fixed" | "percentage";
  discount_amount: string;
  max_discount_amount: string;
  max_uses: string;
  expires_at: string;
  is_new_user_only: boolean;
};

const defaultForm: FormData = {
  code: "", discount_type: "fixed", discount_amount: "",
  max_discount_amount: "", max_uses: "", expires_at: "", is_new_user_only: false,
};

// ─── Main Component ────────────────────────────────────────────────────────
export function TrainerPromosView({ user }: { user: User }) {
  const [codes, setCodes]           = useState<PromoCode[]>([]);
  const [kpi, setKpi]               = useState<KpiData | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [form, setForm]             = useState<FormData>(defaultForm);
  const [isSaving, setIsSaving]     = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user.id) return;
    try {
      setIsLoading(true);
      const res = await trainerPromoApi.getMyPromos(user.id);
      setCodes(res.codes);
      setKpi(res.kpi);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingPromo(null);
    setForm(defaultForm);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const openEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setForm({
      code: promo.code,
      discount_type: promo.discount_type as "fixed" | "percentage",
      discount_amount: String(promo.discount_amount),
      max_discount_amount: promo.max_discount_amount != null ? String(promo.max_discount_amount) : "",
      max_uses: promo.max_uses != null ? String(promo.max_uses) : "",
      expires_at: promo.expires_at ? promo.expires_at.split("T")[0] : "",
      is_new_user_only: promo.is_new_user_only,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!form.code.trim() || !form.discount_amount) { setFormError("Code and Discount Amount are required."); return; }
    const payload: Partial<PromoCode> = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_amount: parseFloat(form.discount_amount),
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_new_user_only: form.is_new_user_only,
    };
    try {
      setIsSaving(true);
      if (editingPromo) {
        await trainerPromoApi.update(editingPromo.id, user.id!, payload);
        setFormSuccess("Referral code updated!");
      } else {
        await trainerPromoApi.create(user.id!, payload);
        setFormSuccess("Referral code created!");
      }
      await fetchData();
      setTimeout(() => setIsModalOpen(false), 900);
    } catch (err: any) {
      setFormError(err?.errors?.code?.[0] ?? err?.message ?? "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this referral code?") || !user.id) return;
    try { await trainerPromoApi.delete(id, user.id); fetchData(); } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">
            My Referral Codes
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and track your personal discount code performance.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shrink-0">
          <Plus className="w-4 h-4" /> Create Referral Code
        </Button>
      </div>

      {/* KPI Stats */}
      {isLoading || !kpi ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<Users className="w-6 h-6 text-teal-600" />}       label="Total Redemptions" value={kpi.total_redemptions}     sub="across all your codes" bg="bg-teal-50" />
          <KpiCard icon={<DollarSign className="w-6 h-6 text-emerald-600" />} label="Customer Savings"   value={`$${kpi.total_savings}`}  sub="total discount generated" bg="bg-emerald-50" />
          <KpiCard icon={<Star className="w-6 h-6 text-amber-500" />}        label="KPI Score"           value={kpi.kpi_score}            sub={`Tier: ${kpi.kpi_tier.label}`} bg="bg-amber-50" />
          <KpiCard icon={<TrendingUp className="w-6 h-6 text-violet-600" />} label="Active Codes"        value={codes.filter((c) => c.is_active).length} sub={`of ${codes.length} total`} bg="bg-violet-50" />
          <KpiProgressCard kpi={kpi} />
        </div>
      )}

      {/* My Codes Table */}
      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ticket className="w-5 h-5 text-teal-600" /> My Active Referral Codes</CardTitle>
          <CardDescription>Only you can see and manage these codes. Usage stats update in real time.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Cap</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>KPI Pts</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No referral codes yet. Create your first one!
                      </TableCell>
                    </TableRow>
                  ) : codes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-mono font-bold tracking-widest text-sm">{promo.code}</TableCell>
                      <TableCell>{promo.discount_type === "percentage" ? `${promo.discount_amount}%` : `$${promo.discount_amount}`}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{promo.max_discount_amount != null ? `$${promo.max_discount_amount}` : "—"}</TableCell>
                      <TableCell>
                        <Badge className={promo.is_active ? "bg-teal-500 text-white" : ""} variant={promo.is_active ? "default" : "secondary"}>
                          {promo.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{promo.times_used}</span>
                        {promo.max_uses != null && <span className="text-slate-400 text-xs"> / {promo.max_uses}</span>}
                      </TableCell>
                      <TableCell className="font-bold text-amber-600">+{promo.times_used * 10}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(promo)} className="hover:text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)} className="hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-teal-600" />
              {editingPromo ? "Edit Referral Code" : "Create Referral Code"}
            </DialogTitle>
            <DialogDescription>
              {editingPromo ? `Editing "${editingPromo.code}".` : "Create a referral code unique to you. Every redemption earns KPI points!"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-code">Code</Label>
              <Input id="t-code" placeholder="e.g. COACH_JOHN" value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="font-mono uppercase tracking-widest" disabled={isSaving || !!editingPromo} />
              {!editingPromo && <p className="text-xs text-slate-400">Tip: include your name to personalise it!</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-type">Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v as "fixed" | "percentage" })} disabled={isSaving}>
                  <SelectTrigger id="t-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-amount">Amount {form.discount_type === "percentage" ? "(%)" : "($)"}</Label>
                <Input id="t-amount" type="number" min="0" step="0.01" value={form.discount_amount}
                  onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} disabled={isSaving} />
              </div>
            </div>
            {form.discount_type === "percentage" && (
              <div className="space-y-1.5">
                <Label htmlFor="t-cap">Max Cap ($) <span className="text-xs text-slate-400">optional</span></Label>
                <Input id="t-cap" type="number" min="0" step="0.01" placeholder="e.g. 30.00"
                  value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} disabled={isSaving} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-uses">Max Uses</Label>
                <Input id="t-uses" type="number" min="1" placeholder="Unlimited" value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })} disabled={isSaving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-exp">Expires At</Label>
                <Input id="t-exp" type="date" value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })} disabled={isSaving} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input id="t-newuser" type="checkbox" checked={form.is_new_user_only}
                onChange={(e) => setForm({ ...form, is_new_user_only: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-amber-500" disabled={isSaving} />
              <Label htmlFor="t-newuser" className="cursor-pointer select-none">
                New Members Only <span className="text-xs text-slate-400">(≤ 30 days)</span>
              </Label>
            </div>
            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />{formError}
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />{formSuccess}
              </div>
            )}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : editingPromo ? "Save Changes" : "Create Code"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
