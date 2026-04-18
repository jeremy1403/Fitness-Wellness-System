import { cn } from "@/lib/utils";

type Variant = "teal" | "amber" | "slate" | "indigo";

const variants: Record<Variant, { base: string; blobA: string; blobB: string }> = {
  teal: {
    base: "bg-[#083344]",
    blobA: "bg-[radial-gradient(closest-side,oklch(0.75_0.12_180/0.85),transparent)]",
    blobB: "bg-[radial-gradient(closest-side,oklch(0.55_0.15_200/0.75),transparent)]",
  },
  amber: {
    base: "bg-[#3a2a12]",
    blobA: "bg-[radial-gradient(closest-side,oklch(0.82_0.16_75/0.9),transparent)]",
    blobB: "bg-[radial-gradient(closest-side,oklch(0.60_0.18_45/0.78),transparent)]",
  },
  slate: {
    base: "bg-slate-950",
    blobA: "bg-[radial-gradient(closest-side,oklch(0.55_0.12_260/0.45),transparent)]",
    blobB: "bg-[radial-gradient(closest-side,oklch(0.45_0.10_220/0.35),transparent)]",
  },
  indigo: {
    base: "bg-[#1a1443]",
    blobA: "bg-[radial-gradient(closest-side,oklch(0.65_0.20_290/0.85),transparent)]",
    blobB: "bg-[radial-gradient(closest-side,oklch(0.55_0.18_250/0.70),transparent)]",
  },
};

const noiseStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
  backgroundRepeat: "repeat" as const,
  backgroundSize: "256px 256px",
};

interface MeshGradientProps {
  variant?: Variant;
  className?: string;
  noise?: boolean;
}

export function MeshGradient({
  variant = "teal",
  className,
  noise = true,
}: MeshGradientProps) {
  const v = variants[variant];
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className={cn("absolute inset-0", v.base)} />
      <div
        className={cn(
          "animate-blob-a absolute -left-[15%] -top-[20%] h-[70%] w-[70%] rounded-full blur-3xl",
          v.blobA,
        )}
      />
      <div
        className={cn(
          "animate-blob-b absolute -bottom-[25%] -right-[15%] h-[80%] w-[80%] rounded-full blur-3xl",
          v.blobB,
        )}
      />
      {noise && (
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={noiseStyle} />
      )}
    </div>
  );
}
