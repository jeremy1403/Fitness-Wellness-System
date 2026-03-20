import RouteCards from "@/components/ui/RouteCards";
import { filterNav, adminNav } from "@/lib/navigation";

export default function AdminClassesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Classes</h1>
        <p className="mt-2 text-sm text-slate-600">
          Module 2 placeholder. Class management controls will be added.
        </p>
      </div>
      <RouteCards items={filterNav(adminNav, "/admin/classes")} />
    </div>
  );
}
