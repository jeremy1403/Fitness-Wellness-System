"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface AuthHeroPanelProps {
  brand?: string;
  quote: string;
  footer?: string;
  tone?: "indigo" | "teal";
}

const toneMap = {
  indigo: {
    base: "from-slate-950 to-indigo-950",
    blobA: "bg-[radial-gradient(closest-side,oklch(0.55_0.14_285/0.55),transparent)]",
    blobB: "bg-[radial-gradient(closest-side,oklch(0.50_0.18_250/0.45),transparent)]",
  },
  teal: {
    base: "from-slate-950 to-teal-950",
    blobA: "bg-[radial-gradient(closest-side,oklch(0.55_0.15_200/0.55),transparent)]",
    blobB: "bg-[radial-gradient(closest-side,oklch(0.50_0.12_180/0.45),transparent)]",
  },
};

const noiseStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
  backgroundRepeat: "repeat" as const,
  backgroundSize: "256px 256px",
};

export function AuthHeroPanel({
  brand = "Fitness & Wellness",
  quote,
  footer = "Secure · Reliable · Modern",
  tone = "teal",
}: AuthHeroPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = quote.split(" ");
  const palette = toneMap[tone];

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReduced) {
        gsap.set(".auth-quote-word", { opacity: 1, y: 0 });
        return;
      }

      gsap.set(".auth-quote-word", { opacity: 0, y: 28 });
      gsap.to(".auth-quote-word", {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.3,
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={`relative hidden flex-col justify-between overflow-hidden bg-linear-to-br p-10 lg:flex ${palette.base}`}
    >
      <motion.div
        aria-hidden
        animate={{
          x: ["-6%", "8%", "-6%"],
          y: ["-4%", "5%", "-4%"],
        }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
        className={`pointer-events-none absolute -left-[10%] -top-[15%] h-[70%] w-[70%] rounded-full blur-3xl ${palette.blobA}`}
      />
      <motion.div
        aria-hidden
        animate={{
          x: ["5%", "-6%", "5%"],
          y: ["4%", "-5%", "4%"],
        }}
        transition={{ duration: 28, ease: "easeInOut", repeat: Infinity }}
        className={`pointer-events-none absolute -bottom-[20%] -right-[10%] h-[75%] w-[75%] rounded-full blur-3xl ${palette.blobB}`}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={noiseStyle}
      />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">
          {brand}
        </span>
        <span className="size-2 rounded-full bg-white/40" />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
          — A thought
        </p>
        <p className="font-display text-5xl italic leading-[1.05] text-white/90">
          {words.map((w, i) => (
            <span key={i} className="auth-quote-word mr-2 inline-block">
              {w}
            </span>
          ))}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <p className="text-xs text-white/30">{footer}</p>
        <span className="font-display text-xs italic text-white/30">
          studio
        </span>
      </div>
    </div>
  );
}
