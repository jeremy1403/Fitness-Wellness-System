"use client";

import { useState, useEffect, useCallback } from "react";
import { userPromoApi, type PromoCode } from "@/lib/api/promo.api";
import { PromoCodeInput } from "@/components/ui/promo-code-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types/auth";
import {
  Ticket,
  Clock,
  Zap,
  Lock,
  Infinity,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Users,
} from "lucide-react";

// ─── Inline Toast ──────────────────────────────────────────────────────────
type Toast = { id: number; message: string; type: "success" | "error" };

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium cursor-pointer transition-all animate-in slide-in-from-bottom-4 ${
            t.type === "success" ? "bg-teal-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function isPromoValid(promo: PromoCode): boolean {
  if (!promo.is_active) return false;
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return false;
  if (promo.max_uses !== null && promo.times_used >= promo.max_uses) return false;
  return true;
}

// ─── Voucher Card ──────────────────────────────────────────────────────────
function VoucherCard({
  promo,
  applied,
  onApply,
  isApplying,
}: {
  promo: PromoCode;
  applied: boolean;
  onApply: (code: string) => void;
  isApplying: boolean;
}) {
  const valid = isPromoValid(promo);
  const isPercentage = promo.discount_type === "percentage";
  const usagePercent =
    promo.max_uses != null ? Math.min((promo.times_used / promo.max_uses) * 100, 100) : 0;

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        valid
          ? "bg-gradient-to-br from-white to-teal-50 border-teal-200 shadow-lg shadow-teal-900/10 hover:shadow-xl hover:-translate-y-0.5"
          : "bg-slate-50 border-slate-200 opacity-50 grayscale cursor-not-allowed shadow-sm"
      }`}
    >
      <div className={`h-1.5 w-full ${valid ? "bg-gradient-to-r from-teal-500 to-amber-500" : "bg-slate-300"}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${valid ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"}`}>
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <p className="font-mono font-bold tracking-widest text-sm text-slate-800">{promo.code}</p>
              <p className="text-xs text-slate-500 mt-0.5">{isPercentage ? "Percentage Discount" : "Fixed Discount"}</p>
            </div>
          </div>
          {valid ? (
            <Badge className="bg-teal-500 hover:bg-teal-600 text-white text-xs shrink-0">
              <Zap className="w-3 h-3 mr-1" /> Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs shrink-0">
              <Lock className="w-3 h-3 mr-1" />
              {!promo.is_active ? "Inactive" : promo.expires_at && new Date(promo.expires_at) < new Date() ? "Expired" : "Limit Reached"}
            </Badge>
          )}
        </div>

        {/* Discount value */}
        <div className={`text-center py-3 rounded-xl ${valid ? "bg-teal-600/10" : "bg-slate-100"}`}>
          <p className={`text-4xl font-extrabold tracking-tight ${valid ? "text-teal-700" : "text-slate-400"}`}>
            {isPercentage ? `${promo.discount_amount}%` : `$${promo.discount_amount}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">{isPercentage ? "off your order" : "flat discount"}</p>
          {isPercentage && promo.max_discount_amount != null && (
            <p className="text-xs font-semibold text-amber-600 mt-1.5">capped at ${promo.max_discount_amount}</p>
          )}
        </div>

        {/* New User Only badge */}
        {promo.is_new_user_only && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            <Users className="w-3.5 h-3.5 shrink-0" />
            New members only (account ≤ 30 days)
          </div>
        )}

        {/* Usage bar */}
        {promo.max_uses != null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{promo.times_used} used</span>
              <span>{promo.max_uses} total</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${valid ? "bg-teal-500" : "bg-slate-400"}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        )}

        {promo.max_uses == null && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Infinity className="w-3.5 h-3.5" /> Unlimited uses
          </div>
        )}

        {/* Expiry */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 border-t border-dashed pt-3">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {promo.expires_at
            ? `Expires ${new Date(promo.expires_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
            : "No expiry date"}
        </div>

        {/* Apply Button */}
        {valid && (
          <Button
            className={`w-full text-sm font-semibold transition-all ${
              applied
                ? "bg-teal-50 text-teal-700 border border-teal-300 hover:bg-teal-50 cursor-default"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
            disabled={applied || isApplying}
            onClick={() => !applied && onApply(promo.code)}
          >
            {applied ? (
              <><CheckCircle2 className="w-4 h-4 mr-2" />Applied ✓</>
            ) : isApplying ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying…</>
            ) : (
              "Apply Voucher"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function MemberPromosView({ user }: { user: User }) {
  const [promos, setPromos]         = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [toasts, setToasts]         = useState<Toast[]>([]);
  const [toastCounter, setToastCounter] = useState(0);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = toastCounter + 1;
    setToastCounter(id);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, [toastCounter]);

  useEffect(() => {
    userPromoApi.getAvailable().then(setPromos).catch(console.error).finally(() => setIsLoading(false));
    if (user.id) {
      userPromoApi.getActive(user.id).then((res) => {
        if (res.active_promo?.code) setAppliedCode(res.active_promo.code);
      }).catch(() => {});
    }
  }, [user.id]);

  const handleApply = async (code: string) => {
    if (!user.id) return;
    setApplyingCode(code);
    try {
      await userPromoApi.apply(code, user.id);
      setAppliedCode(code);
      addToast("Voucher applied! It will be automatically used at checkout.", "success");
    } catch (err: any) {
      addToast(err?.message ?? "Failed to apply voucher.", "error");
    } finally {
      setApplyingCode(null);
    }
  };

  const activePromos   = promos.filter(isPromoValid);
  const inactivePromos = promos.filter((p) => !isPromoValid(p));

  return (
    <div className="space-y-8">
      <ToastList toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">
          Available Vouchers
        </h1>
        <p className="text-muted-foreground mt-2">Browse active discount codes and apply them at checkout.</p>
        {appliedCode && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-4 py-1.5 text-sm font-semibold text-teal-700">
            <CheckCircle2 className="w-4 h-4" />
            Active voucher: <span className="font-mono tracking-widest">{appliedCode}</span>
          </div>
        )}
      </div>

      {/* Promo Code Input — exported for Member 4 checkout integration */}
      <div className="max-w-md">
        <p className="text-sm font-medium text-slate-700 mb-2">🔒 Test Promo Validation &amp; Rate Limiting</p>
        <PromoCodeInput userId={user.id} />
      </div>

      {/* Voucher Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : promos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No vouchers available right now.</p>
            <p className="text-sm mt-1">Check back soon for new discount campaigns!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activePromos.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-teal-600 mb-3">
                ✦ Available Now — {activePromos.length} voucher{activePromos.length !== 1 ? "s" : ""}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activePromos.map((p) => (
                  <VoucherCard key={p.id} promo={p} applied={appliedCode === p.code} onApply={handleApply} isApplying={applyingCode === p.code} />
                ))}
              </div>
            </section>
          )}
          {inactivePromos.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">Unavailable / Expired</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {inactivePromos.map((p) => (
                  <VoucherCard key={p.id} promo={p} applied={false} onApply={() => {}} isApplying={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
