import RouteCards from "@/components/ui/RouteCards";
import { filterNav, userNav } from "@/lib/navigation";

export default function BookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Module 3 placeholder. Booking actions will be enabled later.
        </p>
      </div>
      <RouteCards items={filterNav(userNav, "/app/bookings")} />
    </div>
  );
}
