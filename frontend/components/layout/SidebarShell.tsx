"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import type { NavItem } from "@/lib/navigation";
import { appConfig } from "@/lib/config";
import { useAuth } from "@/lib/auth/context";

const variants = {
  user: {
    accent: "text-teal-600",
    pill: "bg-teal-500/10 text-teal-700",
    sidebar: "bg-slate-950 text-slate-100",
  },
  admin: {
    accent: "text-amber-600",
    pill: "bg-amber-500/10 text-amber-700",
    sidebar: "bg-zinc-950 text-zinc-100",
  },
} as const;

type SidebarShellProps = {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  variant?: keyof typeof variants;
  children: ReactNode;
};

const isActiveRoute = (pathname: string, href: string) =>
  pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

export default function SidebarShell({
  title,
  subtitle,
  nav,
  variant = "user",
  children,
}: SidebarShellProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const activeMap = useMemo(
    () => new Map(nav.map((item) => [item.href, isActiveRoute(pathname, item.href)])),
    [nav, pathname],
  );

  const theme = variants[variant];

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#e2e8f0,_transparent_58%)]" />
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 ${
            theme.sidebar
          } px-3 py-4 transition-transform duration-200 md:static md:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } ${collapsed ? "md:w-20" : "md:w-64"}`}
        >
          <div className="flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">
                {appConfig.name.slice(0, 1)}
              </div>
              {!collapsed && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    {title}
                  </p>
                  <p className="text-xs text-white/50">{appConfig.name}</p>
                </div>
              )}
            </div>
            <button
              type="button"
              className="hidden rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white md:inline-flex"
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white md:hidden"
              onClick={() => setMobileOpen(false)}
            >
              Close
            </button>
          </div>

          {subtitle && !collapsed && (
            <p className="mt-4 px-2 text-xs text-white/50">{subtitle}</p>
          )}

          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {nav.map((item) => {
              const active = activeMap.get(item.href) ?? false;
              const label = collapsed && item.shortLabel ? item.shortLabel : item.label;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white/12 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold ${
                      active ? "bg-white text-slate-900" : "bg-white/10"
                    }`}
                  >
                    {label.slice(0, 1)}
                  </span>
                  {!collapsed && (
                    <span className="flex flex-col">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-white/50">{item.description}</span>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            {!collapsed && user && !isLoading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/70">
                <p className="truncate font-semibold text-white">{user.name}</p>
                <p className="mt-0.5 truncate text-white/60">{user.email}</p>
              </div>
            )}
            <button
              type="button"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await logout();
                } finally {
                  setLoggingOut(false);
                }
              }}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold">
                {loggingOut ? "..." : "X"}
              </span>
              {!collapsed && (
                <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
              )}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:hidden">
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.pill}`}
              onClick={() => setMobileOpen(true)}
            >
              Menu
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500">{appConfig.name}</p>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
              <div className={`text-sm font-semibold uppercase ${theme.accent}`}>
                {title}
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
