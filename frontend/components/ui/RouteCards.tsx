"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { RouteCardItem } from "@/lib/navigation";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function RouteCards({ items }: { items: RouteCardItem[] }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {items.map((item) => (
        <motion.div key={item.href} variants={itemVariants}>
          <Link
            href={item.href}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-linear-to-br from-slate-100 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-xl leading-tight tracking-tight text-slate-900">
                {item.label}
              </h3>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-300 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white">
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {item.description ?? "Navigate to this section."}
            </p>
            <div className="mt-auto pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition-colors duration-300 group-hover:text-slate-700">
                Open section
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
