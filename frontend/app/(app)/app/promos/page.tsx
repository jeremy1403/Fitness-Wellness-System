"use client";

import { useAuth } from "@/lib/auth/context";
import { MemberPromosView } from "@/components/promo/MemberPromosView";
import { TrainerPromosView } from "@/components/promo/TrainerPromosView";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * /app/promos — Shared "Vouchers" route for both Members and Trainers.
 *
 * The outer Layout (SidebarShell) and Navbar are identical for both roles.
 * This page performs a single conditional render based on the authenticated
 * user's primary role, resolved from the existing AuthContext:
 *
 *   • trainer  → TrainerPromosView  (KPI dashboard + referral code management)
 *   • member   → MemberPromosView   (voucher browse + apply at checkout)
 */
export default function PromosPage() {
  const { user, isLoading, hasRole } = useAuth();

  // While auth state is hydrating, show neutral skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Should never happen inside an auth-guarded layout, but guard anyway
  if (!user) return null;

  // ── Conditional render based on role ──────────────────────────────────
  if (hasRole("trainer")) {
    return <TrainerPromosView user={user} />;
  }

  return <MemberPromosView user={user} />;
}
