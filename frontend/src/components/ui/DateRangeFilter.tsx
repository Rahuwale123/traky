import { DATE_RANGE_PRESETS, type DateRange } from "../../lib/dateRange";
import { cn } from "../../lib/utils";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-black/5 p-1">
        {DATE_RANGE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange({ preset: preset.value, start: value.start, end: value.end })}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              value.preset === preset.value ? "bg-ink text-white" : "text-ink-soft hover:bg-white/70",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {value.preset === "custom" ? (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.start ?? ""}
            max={value.end}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-xs text-muted">to</span>
          <input
            type="date"
            value={value.end ?? ""}
            min={value.start}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      ) : null}
    </div>
  );
}
