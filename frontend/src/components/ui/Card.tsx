import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl bg-white p-6 shadow-soft", className)} {...rest} />;
}

type Tone = "lavender" | "dark" | "rose" | "critical";

const toneClasses: Record<Tone, string> = {
  lavender: "bg-card-lavender text-card-lavender-text",
  dark: "bg-card-dark text-white",
  rose: "bg-card-rose text-card-rose-text",
  critical: "bg-[#fbe2e2] text-[#7a2222]",
};

interface TintedCardProps {
  tone: Tone;
  eyebrow: ReactNode;
  eyebrowIcon?: ReactNode;
  title: ReactNode;
  tag?: ReactNode;
  className?: string;
}

export function TintedCard({ tone, eyebrow, eyebrowIcon, title, tag, className }: TintedCardProps) {
  return (
    <div className={cn("rounded-3xl p-5", toneClasses[tone], className)}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-80">
          {eyebrowIcon}
          {eyebrow}
        </span>
        {tag ? (
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink">{tag}</span>
        ) : null}
      </div>
      <p className="mt-3 text-lg font-bold leading-snug">{title}</p>
    </div>
  );
}
