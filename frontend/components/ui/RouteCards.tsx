import Link from "next/link";
import type { NavItem } from "@/lib/navigation";

export default function RouteCards({ items }: { items: NavItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              {item.label}
            </h3>
            <span className="text-xs font-semibold uppercase text-slate-400 group-hover:text-slate-600">
              Open
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {item.description ?? "Navigate to this section."}
          </p>
        </Link>
      ))}
    </div>
  );
}
