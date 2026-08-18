import { Avatar } from "../ui/Avatar";

export interface WorkloadRow {
  id: string;
  name: string;
  value: number;
}

interface WorkloadBarProps {
  rows: WorkloadRow[];
  unit?: string;
  onRowClick?: (id: string) => void;
}

export function WorkloadBar({ rows, unit = "tasks", onRowClick }: WorkloadBarProps) {
  const top = [...rows].sort((a, b) => b.value - a.value).slice(0, 6);
  const max = Math.max(1, ...top.map((r) => r.value));

  if (top.length === 0) {
    return <p className="text-sm text-muted">No one to show yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3.5">
      {top.map((row) => (
        <div
          key={row.id}
          onClick={onRowClick ? () => onRowClick(row.id) : undefined}
          className={`flex items-center gap-3 ${onRowClick ? "-mx-2 cursor-pointer rounded-xl px-2 py-1 transition-colors hover:bg-black/[0.03]" : ""}`}
        >
          <Avatar name={row.name} size={26} />
          <span className="w-28 shrink-0 truncate text-sm text-ink-soft">{row.name}</span>
          <div className="group relative flex-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-accent/10">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </div>
            <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
              <span className="font-semibold">{row.value}</span> {unit}
            </div>
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-ink">
            {row.value}
          </span>
        </div>
      ))}
      {rows.length > top.length ? (
        <p className="text-xs text-muted">+{rows.length - top.length} more</p>
      ) : null}
    </div>
  );
}
