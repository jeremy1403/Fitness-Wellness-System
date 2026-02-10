import RouteCards from "@/components/ui/RouteCards";
import { filterNav, userNav } from "@/lib/navigation";

export default function ClassesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Classes</h1>
        <p className="mt-2 text-sm text-slate-600">
          Module 2 placeholder. Browse class catalog once APIs are wired.
        </p>
      </div>
      <RouteCards items={filterNav(userNav, "/app/classes")} />
    </div>
  );
}
