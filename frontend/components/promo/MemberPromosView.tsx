"use client";

import { useState, useEffect, useCallback } from "react";
import { userPromoApi, type PromoCode } from "@/lib/api/promo.api";
import { membershipApi, type Membership } from "@/lib/api/membership.api";
import { PromoCodeInput } from "@/components/ui/promo-code-input";
import { XRayDebugger } from "@/components/promo/XRayDebugger";
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
  Eye,
  EyeOff,
  Crown,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

// ─── Inline Toast ──────────────────────────────────────────────────────────
type Toast = { id: number; message: string; type: "success" | "error" };

function ToastList({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
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

// ─── User Ecosystem Status Banner ─────────────────────────────────────────
function EcosystemBanner({
  user,
  membership,
  membershipLoading,
}: {
  user: User;
  membership: Membership | null;
  membershipLoading: boolean;
}) {
  // New-user calculation — consumes user.created_at (Member 1's data)
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const newUserDaysLeft = Math.max(0, 30 - accountAgeDays);
  const isNewUser = accountAgeDays <= 30;
  const newUserProgress = Math.min(100, (accountAgeDays / 30) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-teal-600 text-white">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Web Service Consumer · Member 4 API
          </p>
          <p className="text-sm font-bold text-slate-800">User Ecosystem Status</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Membership Status — consuming GET /memberships/my */}
        <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-mono">
            <Crown className="w-3.5 h-3.5" />
            GET /memberships/my
          </div>
          {membershipLoading ? (
            <Skeleton className="h-6 w-32 rounded-lg" />
          ) : membership ? (
            <>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="text-yellow-500">👑</span>
                {membership.plan?.name ?? "Active Plan"}
              </p>
              <Badge className="mt-1 text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-mono">
                ACTIVE
              </Badge>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-500">No Active Plan</p>
              <Badge variant="secondary" className="mt-1 text-[10px]">
                UNSUBSCRIBED
              </Badge>
            </>
          )}
        </div>

        {/* Membership Expiry */}
        <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-mono">
            <CalendarDays className="w-3.5 h-3.5" />
            end_date
          </div>
          {membershipLoading ? (
            <Skeleton className="h-6 w-28 rounded-lg" />
          ) : membership?.end_date ? (
            <>
              <p className="text-sm font-bold text-slate-900">
                {new Date(membership.end_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Membership expires</p>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-400">—</p>
          )}
        </div>

        {/* New User Privilege — consuming user.created_at (Member 1) */}
        <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-mono">
            <Users className="w-3.5 h-3.5" />
            user.created_at
          </div>
          <p className="text-sm font-bold text-slate-900">
            {isNewUser ? (
              <span className="text-emerald-600">Expires in {newUserDaysLeft}d</span>
            ) : (
              <span className="text-slate-400 line-through">Expired</span>
            )}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 mb-1.5">New User Privilege (30d)</p>
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isNewUser ? "bg-emerald-400" : "bg-slate-300"
              }`}
              style={{ width: `${newUserProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Day {Math.min(accountAgeDays, 30)} of 30
          </p>
        </div>
      </div>
    </div>
  );
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
  const valid                = isPromoValid(promo);
  const alreadyUsed          = !!promo.is_already_used;
  const tierBlocked          = promo.required_plan_id != null && promo.user_meets_tier_requirement === false;
  const isPercentage         = promo.discount_type === "percentage";
  const usagePercent         =
    promo.max_uses != null
      ? Math.min((promo.times_used / promo.max_uses) * 100, 100)
      : 0;

  const effectively_valid    = valid && !alreadyUsed && !tierBlocked;

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        effectively_valid
          ? "bg-gradient-to-br from-white to-teal-50 border-teal-200 shadow-lg shadow-teal-900/10 hover:shadow-xl hover:-translate-y-0.5"
          : "bg-slate-50 border-slate-200 opacity-60 grayscale cursor-not-allowed shadow-sm"
      }`}
    >
      <div
        className={`h-1.5 w-full ${
          effectively_valid
            ? "bg-gradient-to-r from-teal-500 to-amber-500"
            : "bg-slate-300"
        }`}
      />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                effectively_valid
                  ? "bg-teal-100 text-teal-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <p className="font-mono font-bold tracking-widest text-sm text-slate-800">
                {promo.code}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPercentage ? "Percentage Discount" : "Fixed Discount"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {effectively_valid ? (
              <Badge className="bg-teal-500 hover:bg-teal-600 text-white text-xs shrink-0">
                <Zap className="w-3 h-3 mr-1" /> Active
              </Badge>
            ) : alreadyUsed ? (
              <Badge variant="secondary" className="text-xs shrink-0 bg-slate-100 text-slate-500">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Redeemed
              </Badge>
            ) : tierBlocked ? (
              <Badge className="text-xs shrink-0 bg-purple-50 text-purple-700 border border-purple-200">
                <Crown className="w-3 h-3 mr-1" />
                {promo.required_plan_name ?? "Members Only"}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Lock className="w-3 h-3 mr-1" />
                {!promo.is_active
                  ? "Inactive"
                  : promo.expires_at && new Date(promo.expires_at) < new Date()
                  ? "Expired"
                  : "Limit Reached"}
              </Badge>
            )}
          </div>
        </div>

        {/* Tier restriction notice */}
        {promo.required_plan_id != null && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-2 border ${
              tierBlocked
                ? "text-purple-700 bg-purple-50 border-purple-200"
                : "text-emerald-700 bg-emerald-50 border-emerald-200"
            }`}
          >
            {tierBlocked ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Requires <strong className="ml-1">{promo.required_plan_name}</strong> membership
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Your <strong className="mx-1">{promo.required_plan_name}</strong> plan unlocks this voucher
              </>
            )}
          </div>
        )}

        {/* Discount value */}
        <div
          className={`text-center py-3 rounded-xl ${
            effectively_valid ? "bg-teal-600/10" : "bg-slate-100"
          }`}
        >
          <p
            className={`text-4xl font-extrabold tracking-tight ${
              effectively_valid ? "text-teal-700" : "text-slate-400"
            }`}
          >
            {isPercentage ? `${promo.discount_amount}%` : `RM ${promo.discount_amount}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isPercentage ? "off your order" : "flat discount"}
          </p>
          {isPercentage && promo.max_discount_amount != null && (
            <p className="text-xs font-semibold text-amber-600 mt-1.5">
              capped at RM {promo.max_discount_amount}
            </p>
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
                className={`h-full rounded-full transition-all ${
                  effectively_valid ? "bg-teal-500" : "bg-slate-400"
                }`}
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
            ? `Expires ${new Date(promo.expires_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}`
            : "No expiry date"}
        </div>

        {/* CTA — Apply / Already Redeemed / Tier Blocked */}
        {alreadyUsed ? (
          <div className="w-full text-sm font-semibold text-center py-2 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed">
            <CheckCircle2 className="inline w-4 h-4 mr-1.5 mb-0.5" />
            Already Redeemed ✓
          </div>
        ) : tierBlocked ? (
          <div className="w-full text-sm font-semibold text-center py-2 rounded-lg bg-purple-50 text-purple-500 border border-purple-200 cursor-not-allowed">
            <Crown className="inline w-4 h-4 mr-1.5 mb-0.5" />
            Requires {promo.required_plan_name} Plan
          </div>
        ) : effectively_valid ? (
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
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Applied ✓
              </>
            ) : isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying…
              </>
            ) : (
              "Apply Voucher"
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function MemberPromosView({ user }: { user: User }) {
  const [promos, setPromos]               = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [appliedCode, setAppliedCode]     = useState<string | null>(null);
  const [applyingCode, setApplyingCode]   = useState<string | null>(null);
  const [toasts, setToasts]               = useState<Toast[]>([]);
  const [toastCounter, setToastCounter]   = useState(0);

  // ── Membership (consuming Member 4) ────────────────────────────────────
  const [membership, setMembership]         = useState<Membership | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(true);

  // ── X-Ray Debugger state ────────────────────────────────────────────────
  const [xrayEnabled, setXrayEnabled]     = useState(false);
  const [xrayTrigger, setXrayTrigger]     = useState<string | null>(null);

  const addToast = useCallback(
    (message: string, type: "success" | "error") => {
      const id = toastCounter + 1;
      setToastCounter(id);
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
    },
    [toastCounter]
  );

  useEffect(() => {
    // Fetch available promos
    userPromoApi
      .getAvailable()
      .then((data) => setPromos(Array.isArray(data) ? data : (data as any)?.data ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));

    // Check cached active promo
    if (user.id) {
      userPromoApi
        .getActive(user.id)
        .then((res) => {
          if (res.active_promo?.code) setAppliedCode(res.active_promo.code);
        })
        .catch(() => {});
    }

    // ── Consume Member 4: GET /api/v1/memberships/my ─────────────────────
    // This call explicitly proves cross-module Service Consumption.
    membershipApi
      .myMembership()
      .then((res) => setMembership(res.data))
      .catch(() => setMembership(null))
      .finally(() => setMembershipLoading(false));
  }, [user.id]);

  const handleApply = async (code: string) => {
    if (!user.id) return;
    setApplyingCode(code);

    // Fire X-Ray trace if enabled
    if (xrayEnabled) {
      setXrayTrigger(`${code}-${Date.now()}`);
    }

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

  // Split: blocked-by-tier cards go into inactive section
  const activePromos = promos.filter(
    (p) => isPromoValid(p) && !p.is_already_used && p.user_meets_tier_requirement !== false
  );
  const inactivePromos = promos.filter(
    (p) => !isPromoValid(p) || !!p.is_already_used || p.user_meets_tier_requirement === false
  );

  return (
    <div className="space-y-8">
      <ToastList
        toasts={toasts}
        onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />

      {/* ── X-Ray Debugger (floating terminal) ─────────────────────────── */}
      {xrayEnabled && (
        <XRayDebugger
          triggerCode={xrayTrigger}
          onClose={() => {
            setXrayEnabled(false);
            setXrayTrigger(null);
          }}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">
          Available Vouchers
        </h1>
        <p className="text-muted-foreground mt-2">
          Browse active discount codes and apply them at checkout.
        </p>
        {appliedCode && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-4 py-1.5 text-sm font-semibold text-teal-700">
            <CheckCircle2 className="w-4 h-4" />
            Active voucher:{" "}
            <span className="font-mono tracking-widest">{appliedCode}</span>
          </div>
        )}
      </div>

      {/* ── STEP 3: User Ecosystem Status Banner ─────────────────────────── */}
      <EcosystemBanner
        user={user}
        membership={membership}
        membershipLoading={membershipLoading}
      />

      {/* Promo Code Input */}
      <div className="max-w-md">
        <p className="text-sm font-medium text-slate-700 mb-2">
          🔒 Test Promo Validation &amp; Rate Limiting
        </p>
        <PromoCodeInput userId={user.id} />
      </div>

      {/* ── Voucher Grid ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
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
                ✦ Available Now — {activePromos.length} voucher
                {activePromos.length !== 1 ? "s" : ""}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activePromos.map((p) => (
                  <VoucherCard
                    key={p.id}
                    promo={p}
                    applied={appliedCode === p.code}
                    onApply={handleApply}
                    isApplying={applyingCode === p.code}
                  />
                ))}
              </div>
            </section>
          )}
          {inactivePromos.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Unavailable / Expired / Restricted
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {inactivePromos.map((p) => (
                  <VoucherCard
                    key={p.id}
                    promo={p}
                    applied={false}
                    onApply={() => {}}
                    isApplying={false}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── 👁️ X-Ray Mode Toggle ─────────────────────────────────────────── */}
      <div className="flex justify-center pt-4 border-t border-dashed border-slate-200">
        <button
          type="button"
          onClick={() => {
            const next = !xrayEnabled;
            setXrayEnabled(next);
            if (!next) setXrayTrigger(null);
          }}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border transition-all duration-200 ${
            xrayEnabled
              ? "bg-slate-900 text-teal-400 border-teal-500/50 shadow-lg shadow-teal-900/20"
              : "bg-white text-slate-500 border-slate-200 hover:border-teal-400 hover:text-teal-600"
          }`}
        >
          {xrayEnabled ? (
            <>
              <EyeOff className="w-4 h-4" />
              Disable X-Ray Mode
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              👁️ Toggle X-Ray Mode
            </>
          )}
          {xrayEnabled && (
            <span className="ml-1 h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
}
