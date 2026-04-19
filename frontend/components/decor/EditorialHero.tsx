"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MeshGradient } from "./MeshGradient";

type Variant = "teal" | "amber" | "slate" | "indigo";

interface EditorialHeroProps {
  variant?: Variant;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
  className?: string;
  textTone?: "light" | "dark";
}

const titleToneMap = {
  light: "text-white",
  dark: "text-slate-900",
};

const eyebrowToneMap = {
  light: "text-white/70",
  dark: "text-slate-500",
};

const descTone = {
  light: "text-white/75",
  dark: "text-slate-600",
};

export function EditorialHero({
  variant = "teal",
  eyebrow,
  title,
  description,
  children,
  compact = false,
  className,
  textTone = "light",
}: EditorialHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 shadow-sm",
        compact ? "p-6 md:p-8" : "p-8 md:p-12",
        className,
      )}
    >
      <MeshGradient variant={variant} />
      <div className="relative z-10 flex flex-col gap-5">
        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "inline-flex w-fit items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]",
              eyebrowToneMap[textTone],
            )}
          >
            <span className="inline-block h-px w-6 bg-current opacity-60" />
            {eyebrow}
          </motion.span>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "font-display leading-[1.05] tracking-tight",
            compact ? "text-3xl md:text-4xl" : "text-4xl md:text-6xl",
            titleToneMap[textTone],
          )}
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn("max-w-2xl text-sm md:text-base", descTone[textTone])}
          >
            {description}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
