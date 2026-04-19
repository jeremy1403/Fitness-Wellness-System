"use client";

import { useState, useEffect, useRef } from "react";
import { X, Terminal, Wifi } from "lucide-react";

// ── Trace lines definition ────────────────────────────────────────────────────
const TRACE_LINES = [
  { text: "[>_ CAMPAIGN SIMULATOR STARTED]",                                     color: "text-teal-300",   delay: 0   },
  { text: "[PROTECTION]   Smart Protection Check: Simulating Customer Checkout (1/5)... OK", color: "text-yellow-300", delay: 400 },
  { text: "[PERSONALIZING] Fetching your account profile to tailor offers...",    color: "text-sky-300",    delay: 800 },
  { text: "[PERSONALIZING] Account age verified — new member perks applied.",     color: "text-sky-300",    delay: 1300 },
  { text: "[VALIDATION]   Checking discount eligibility and campaign rules... OK",color: "text-purple-300", delay: 1800 },
  { text: "[SAVING]       Locking in your discount for a seamless checkout.",     color: "text-emerald-300", delay: 2300 },
  { text: "[>_ PREVIEW READY: Voucher Activated — 200 OK]",                       color: "text-teal-300",   delay: 2800 },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────
interface XRayDebuggerProps {
  /** When this changes to a new truthy value, trigger a new trace animation */
  triggerCode: string | null;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function XRayDebugger({ triggerCode, onClose }: XRayDebuggerProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Reset and replay whenever triggerCode changes
  useEffect(() => {
    if (!triggerCode) return;

    setVisibleLines([]);
    setDone(false);

    const timers: ReturnType<typeof setTimeout>[] = [];

    TRACE_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, i]);
          // Auto-scroll terminal to bottom
          if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
          }
          if (i === TRACE_LINES.length - 1) {
            setDone(true);
          }
        }, line.delay)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [triggerCode]);

  if (!triggerCode) return null;

  return (
    <div
      role="dialog"
      aria-label="Architecture X-Ray Debugger"
      className="fixed bottom-6 right-6 z-[9999] w-[520px] max-w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      {/* ── Terminal window chrome ── */}
      <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-slate-700/80 ring-1 ring-inset ring-white/5">

        {/* Title bar */}
        <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            {/* Traffic lights */}
            <span className="h-3 w-3 rounded-full bg-red-500 opacity-90" />
            <span className="h-3 w-3 rounded-full bg-yellow-400 opacity-90" />
            <span className="h-3 w-3 rounded-full bg-green-500 opacity-90" />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-400 uppercase">
            <Terminal className="h-3.5 w-3.5" />
            Campaign Simulator
          </div>

          <button
            onClick={onClose}
            aria-label="Close debugger"
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live signal indicator */}
        <div className="flex items-center gap-2 bg-slate-900 px-4 py-1.5 border-b border-slate-800">
          <Wifi
            className={`h-3 w-3 ${done ? "text-teal-400" : "text-yellow-400 animate-pulse"}`}
          />
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            {done ? "Preview complete — voucher is ready to use" : `Simulating checkout for: ${triggerCode}`}
          </span>
          {!done && (
            <span className="ml-auto flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
          )}
        </div>

        {/* Terminal body */}
        <div
          ref={terminalRef}
          className="bg-slate-950 px-4 py-4 space-y-1.5 h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700"
        >
          {TRACE_LINES.map((line, i) => (
            <div
              key={i}
              className={`font-mono text-xs leading-relaxed transition-all duration-300 ${
                visibleLines.includes(i)
                  ? `${line.color} opacity-100 translate-y-0`
                  : "opacity-0 translate-y-1 pointer-events-none select-none"
              }`}
            >
              <span className="text-slate-600 select-none mr-2">
                {String(i + 1).padStart(2, "0")}
              </span>
              {line.text}
              {/* Blinking cursor on the last visible line while still running */}
              {!done && visibleLines[visibleLines.length - 1] === i && (
                <span className="ml-1 inline-block w-2 h-3.5 bg-teal-400 animate-pulse align-middle" />
              )}
            </div>
          ))}

          {/* Done state bottom bar */}
          {done && (
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-[10px] font-mono text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              SESSION END · {new Date().toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
