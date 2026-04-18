"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Settings, Users, Dumbbell, CalendarCheck } from "lucide-react";
import RouteCards from "@/components/ui/RouteCards";
import { EditorialHero } from "@/components/decor/EditorialHero";
import { CountUp } from "@/components/motion/CountUp";
import { FadeIn } from "@/components/motion/FadeIn";
import { filterNav, adminNav } from "@/lib/navigation";
import { adminApi } from "@/lib/api/admin.api";

interface OverviewStats {
  total: number;
  active: number;
  disabled: number;
  trainers: number;
}

const statDefinitions = [
  {
    key: "total" as const,
    label: "Total users",
    description: "Across every role",
    icon: Users,
  },
  {
    key: "trainers" as const,
    label: "Active trainers",
    description: "On the roster right now",
    icon: Dumbbell,
  },
  {
    key: "active" as const,
    label: "Active accounts",
    description: "Ready to book",
    icon: CalendarCheck,
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          adminApi.getUserStats(),
          adminApi.getUsers(),
        ]);

        if (!isMounted) {
          return;
        }

        const trainers = usersRes.data.filter(
          (u) => u.roles.includes("trainer") && u.status === "active",
        ).length;
        setStats({
          total: statsRes.data.total,
          active: statsRes.data.active,
          disabled: statsRes.data.disabled,
          trainers,
        });
      } catch {
        if (isMounted) {
          setStats({ total: 0, active: 0, disabled: 0, trainers: 0 });
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <EditorialHero
        variant="amber"
        eyebrow="Admin control"
        title={
          <>
            System <em className="italic font-normal text-amber-100">dashboard</em>
          </>
        }
        description="Secure operations, oversight, and health of the studio in one place."
      >
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          <Settings className="size-4" />
          Admin settings
        </Link>
      </EditorialHero>

      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-3">
          {statDefinitions.map((stat, idx) => {
            const Icon = stat.icon;
            const value = stats ? stats[stat.key] : 0;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="pointer-events-none absolute right-0 top-0 h-full w-full bg-linear-to-br from-amber-50/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-4 font-display text-5xl leading-none tracking-tight text-slate-900">
                      {stats ? <CountUp to={value} /> : "—"}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">{stat.description}</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                    <Icon className="size-5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </FadeIn>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Navigate
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight text-slate-900">
              Quick <em className="italic text-amber-700">actions</em>
            </h2>
          </div>
          <span className="hidden text-xs text-slate-400 md:block">
            Jump to any section of the admin system
          </span>
        </div>
        <RouteCards items={filterNav(adminNav, "/admin")} />
      </section>
    </div>
  );
}
