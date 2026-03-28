"use client";

import RouteCards from "@/components/ui/RouteCards";
import { filterNav, userNav } from "@/lib/navigation";

export default function UserClassesPage() {
  const classes = [
    { id: 1, name: "Yoga Flow", level: "Beginner", duration: "60 min" },
    { id: 2, name: "HIIT", level: "Advanced", duration: "45 min" },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((cls) => (
        <div key={cls.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{cls.level}</span>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{cls.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{cls.duration}</p>
          <button className="mt-6 w-full rounded-full border border-slate-900 py-2 text-sm font-medium hover:bg-slate-900 hover:text-white transition">
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}