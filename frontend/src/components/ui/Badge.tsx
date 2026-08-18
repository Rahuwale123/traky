import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Tone = "lavender" | "rose" | "violet" | "neutral" | "dark";

const toneClasses: Record<Tone, string> = {
  lavender: "bg-[#e4e1fb] text-[#2f2a6b]",
  rose: "bg-[#fbe1e6] text-[#7a2b3b]",
  violet: "bg-[#ece1fb] text-[#4c2a8c]",
  neutral: "bg-black/5 text-ink-soft",
  dark: "bg-ink text-white",
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface DotStatusProps {
  children: ReactNode;
  color?: string;
}

export function DotStatus({ children, color = "#4f46e5" }: DotStatusProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}
