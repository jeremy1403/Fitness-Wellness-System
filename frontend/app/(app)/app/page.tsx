"use client";

import Link from "next/link";
import RouteCards from "@/components/ui/RouteCards";
import { filterNav, userNav } from "@/lib/navigation";
import { useAuth } from "@/lib/auth/context";

export default function UserDashboardPage() {
  const { user, primaryRole, isLoading } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              User System Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {isLoading
                ? "Loading..."
                : user
                  ? `Signed in as ${user.name} (${primaryRole}).`
                  : "Loading your dashboard..."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/app/profile"
              className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
            >
              Settings
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Quick navigation</h2>
        <RouteCards items={filterNav(userNav, "/app")} />
      </section>
    </div>
  );
}
