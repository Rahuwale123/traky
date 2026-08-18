interface ProgressMeterProps {
  done: number;
  total: number;
}

export function ProgressMeter({ done, total }: ProgressMeterProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-full min-w-[80px] overflow-hidden rounded-full bg-accent/10">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
        {done}/{total} · {pct}%
      </span>
    </div>
  );
}
