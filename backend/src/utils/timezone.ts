export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** "yyyy-MM-dd" as seen in `timeZone`, for the given instant (defaults to now). */
export function dateStringInTimeZone(timeZone: string, instant: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

/** The calendar date ("yyyy-MM-dd") after `dateStr`, via pure UTC arithmetic — no timezone/DST involved. */
export function nextDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

/**
 * The UTC instant of local midnight for `dateStr` ("yyyy-MM-dd") in `timeZone`.
 * Uses a guess-then-correct approach with Intl so it stays correct across DST
 * transitions (a "day" in a DST zone can be 23h or 25h of real UTC time).
 */
export function startOfDateStringInTimeZone(dateStr: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(guess));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<string, string>;
  const asIfUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  const offsetMs = asIfUtc - guess;
  return new Date(guess - offsetMs);
}

export function endOfDateStringInTimeZone(dateStr: string, timeZone: string): Date {
  return startOfDateStringInTimeZone(nextDateString(dateStr), timeZone);
}

/** Start of the calendar day (in `timeZone`) that `instant` falls on. */
export function startOfDayInTimeZone(instant: Date, timeZone: string): Date {
  return startOfDateStringInTimeZone(dateStringInTimeZone(timeZone, instant), timeZone);
}

/** Exclusive end of the calendar day (in `timeZone`) that `instant` falls on. */
export function endOfDayInTimeZone(instant: Date, timeZone: string): Date {
  return endOfDateStringInTimeZone(dateStringInTimeZone(timeZone, instant), timeZone);
}
