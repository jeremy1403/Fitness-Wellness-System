"use client";

import RouteCards from "@/components/ui/RouteCards";
import { filterNav, userNav } from "@/lib/navigation";

export default function UserSchedulesPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* 每一行代表一个时段 */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
        <div>
          <p className="text-sm font-medium text-slate-500">10:00 AM - 11:00 AM</p>
          <h4 className="text-lg font-bold text-slate-900">Advanced Vinyasa Yoga</h4>
          <p className="text-xs text-slate-400 text-blue-500">Trainer: Sarah Jenkins</p>
        </div>
        <button className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white">
          Book Now
        </button>
      </div>
    </div>
  );
}