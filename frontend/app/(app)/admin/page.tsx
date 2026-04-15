import Link from "next/link";
import RouteCards from "@/components/ui/RouteCards";
import { filterNav, adminNav } from "@/lib/navigation";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Admin System Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Secure access for admin operations and oversight.
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-500"
          >
            Admin settings
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Quick navigation</h2>
        <RouteCards items={filterNav(adminNav, "/admin")} />
      </section>
    </div>
  );
}
