import Link from "next/link";
import { appConfig } from "@/lib/config";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600">
            Fitness & Wellness
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-5xl">
            {appConfig.name} routing hub
          </h1>
          <p className="max-w-2xl text-base text-slate-600 md:text-lg">
            Explore the user system without logging in, or sign in to unlock role-based
            dashboards. Admin access is protected.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View User System
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Login or Register
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">User system</h2>
            <p className="mt-2 text-sm text-slate-600">
              Browse classes, schedules, and membership information. Settings are
              available after login.
            </p>
            <Link
              href="/app"
              className="mt-4 inline-flex text-sm font-semibold text-teal-600"
            >
              Go to user dashboard
            </Link>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Admin system</h2>
            <p className="mt-2 text-sm text-slate-600">
              Manage users, roles, classes, and reports. Admin login required.
            </p>
            <Link
              href="/login?role=admin"
              className="mt-4 inline-flex text-sm font-semibold text-amber-600"
            >
              Sign in as admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
