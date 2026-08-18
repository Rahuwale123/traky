export type DateRangePreset = "all" | "today" | "yesterday" | "week" | "month" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  start?: string; // yyyy-mm-dd, custom only
  end?: string; // yyyy-mm-dd, custom only
}

export interface ResolvedRange {
  start: string;
  end: string;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns null for "all time" — nothing to filter. */
export function resolveDateRange(range: DateRange): ResolvedRange | null {
  const now = new Date();
  const today = toISODate(now);

  switch (range.preset) {
    case "all":
      return null;
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toISODate(y);
      return { start: yStr, end: yStr };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { start: toISODate(start), end: today };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: toISODate(start), end: today };
    }
    case "custom":
      if (!range.start || !range.end) return null;
      return { start: range.start, end: range.end };
    default:
      return null;
  }
}

export function isDateInRange(dateStr: string | null | undefined, resolved: ResolvedRange | null): boolean {
  if (!resolved) return true;
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  return d >= resolved.start && d <= resolved.end;
}

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom" },
];

export function dateRangeLabel(range: DateRange): string {
  return DATE_RANGE_PRESETS.find((p) => p.value === range.preset)?.label ?? "All time";
}

/** Natural-language phrase for use in a sentence, e.g. "Tasks touched {phrase}." */
export function dateRangeSubtitlePhrase(range: DateRange): string {
  switch (range.preset) {
    case "all":
      return "right now";
    case "today":
      return "today";
    case "yesterday":
      return "yesterday";
    case "week":
      return "this week";
    case "month":
      return "this month";
    case "custom":
      return "in the selected range";
    default:
      return "right now";
  }
}
