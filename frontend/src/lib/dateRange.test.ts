import { describe, expect, it } from "vitest";
import { dateRangeLabel, dateRangeSubtitlePhrase, isDateInRange, resolveDateRange } from "./dateRange";

function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("resolveDateRange", () => {
  it("'all' resolves to no filter", () => {
    expect(resolveDateRange({ preset: "all" })).toBeNull();
  });

  it("'today' resolves to the browser's local calendar date, not UTC's", () => {
    const range = resolveDateRange({ preset: "today" });
    expect(range).toEqual({ start: localISODate(new Date()), end: localISODate(new Date()) });
  });

  it("'yesterday' is exactly one local day before today", () => {
    const range = resolveDateRange({ preset: "yesterday" });
    const expected = new Date();
    expected.setDate(expected.getDate() - 1);
    expect(range).toEqual({ start: localISODate(expected), end: localISODate(expected) });
  });

  it("'week' spans exactly 7 days (6 days back through today)", () => {
    const range = resolveDateRange({ preset: "week" });
    expect(range).not.toBeNull();
    const start = new Date(`${range!.start}T00:00:00`);
    const end = new Date(`${range!.end}T00:00:00`);
    const spanDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    expect(spanDays).toBe(7);
    expect(range!.end).toBe(localISODate(new Date()));
  });

  it("'month' starts on the 1st of the current local month and ends today", () => {
    const range = resolveDateRange({ preset: "month" });
    const now = new Date();
    expect(range).toEqual({
      start: localISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: localISODate(now),
    });
  });

  it("'custom' passes through the given start/end verbatim", () => {
    expect(resolveDateRange({ preset: "custom", start: "2026-01-01", end: "2026-01-15" })).toEqual({
      start: "2026-01-01",
      end: "2026-01-15",
    });
  });

  it("'custom' with a missing bound resolves to no filter", () => {
    expect(resolveDateRange({ preset: "custom", start: "2026-01-01" })).toBeNull();
  });
});

describe("isDateInRange", () => {
  const range = { start: "2026-01-10", end: "2026-01-20" };

  it("treats a null resolved range as matching everything", () => {
    expect(isDateInRange("2026-01-01", null)).toBe(true);
    expect(isDateInRange(null, null)).toBe(true);
  });

  it("rejects a missing date against a real range", () => {
    expect(isDateInRange(null, range)).toBe(false);
    expect(isDateInRange(undefined, range)).toBe(false);
  });

  it("is inclusive of both boundary dates", () => {
    expect(isDateInRange("2026-01-10", range)).toBe(true);
    expect(isDateInRange("2026-01-20", range)).toBe(true);
  });

  it("rejects dates outside the range", () => {
    expect(isDateInRange("2026-01-09", range)).toBe(false);
    expect(isDateInRange("2026-01-21", range)).toBe(false);
  });

  it("only compares the date portion of a full timestamp", () => {
    expect(isDateInRange("2026-01-15T23:59:59.000Z", range)).toBe(true);
  });
});

describe("labels", () => {
  it("dateRangeLabel maps every preset to a human label", () => {
    expect(dateRangeLabel({ preset: "all" })).toBe("All time");
    expect(dateRangeLabel({ preset: "week" })).toBe("This week");
  });

  it("dateRangeSubtitlePhrase maps every preset to a sentence phrase", () => {
    expect(dateRangeSubtitlePhrase({ preset: "today" })).toBe("today");
    expect(dateRangeSubtitlePhrase({ preset: "custom" })).toBe("in the selected range");
  });
});
