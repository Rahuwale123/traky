import { useState } from "react";
import { TASK_STATUS_COLORS } from "../../lib/chartColors";
import { taskStatusValues, taskStatusLabels } from "../../features/tasks/constants";
import type { TaskStatus } from "../../features/tasks/types";

interface StatusStackedBarProps {
  counts: Record<TaskStatus, number>;
}

export function StatusStackedBar({ counts }: StatusStackedBarProps) {
  const [hovered, setHovered] = useState<TaskStatus | null>(null);
  const total = taskStatusValues.reduce((sum, s) => sum + counts[s], 0);

  if (total === 0) {
    return <p className="text-sm text-muted">No tasks yet.</p>;
  }

  return (
    <div>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-black/5">
        {taskStatusValues.map((status) => {
          const value = counts[status];
          if (value === 0) return null;
          const pct = (value / total) * 100;
          return (
            <div key={status} className="group relative h-full" style={{ width: `${pct}%` }}>
              <div
                className="h-full w-full transition-opacity"
                style={{
                  backgroundColor: TASK_STATUS_COLORS[status],
                  opacity: hovered && hovered !== status ? 0.45 : 1,
                }}
                onMouseEnter={() => setHovered(status)}
                onMouseLeave={() => setHovered(null)}
                tabIndex={0}
                role="img"
                aria-label={`${taskStatusLabels[status]}: ${value} of ${total}`}
              />
              <div
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                <span className="font-semibold">{value}</span> {taskStatusLabels[status]}
                <span className="text-white/60"> · {Math.round(pct)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {taskStatusValues.map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
            />
            {taskStatusLabels[status]}
            <span className="font-semibold text-ink">{counts[status]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
