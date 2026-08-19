import { describe, expect, it } from "vitest";
import { cn, formatDate, formatMinutes, initials, relativeTime } from "./utils";

describe("initials", () => {
  it("takes the first letter of the first and last name", () => {
    expect(initials("Ava Admin")).toBe("AA");
    expect(initials("Marcus Manager")).toBe("MM");
  });

  it("handles a single name with no last name", () => {
    expect(initials("Cher")).toBe("C");
  });

  it("collapses extra whitespace", () => {
    expect(initials("  Ada   Lovelace  ")).toBe("AL");
  });

  it("uses only the first and last of three or more names", () => {
    expect(initials("Ada Marie Lovelace")).toBe("AL");
  });
});

describe("formatMinutes", () => {
  it("shows minutes only under an hour", () => {
    expect(formatMinutes(0)).toBe("0m");
    expect(formatMinutes(45)).toBe("45m");
  });

  it("shows hours and minutes over an hour", () => {
    expect(formatMinutes(60)).toBe("1h 0m");
    expect(formatMinutes(125)).toBe("2h 5m");
  });
});

describe("formatDate", () => {
  it("returns an em dash for null/undefined", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats a real date to include the year", () => {
    expect(formatDate("2026-08-19T00:00:00.000Z")).toContain("2026");
  });
});

describe("relativeTime", () => {
  it("reports 'Just now' for the current instant", () => {
    expect(relativeTime(new Date().toISOString())).toBe("Just now");
  });

  it("reports minutes ago for recent timestamps", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(relativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("reports hours ago once past 60 minutes", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(relativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("reports days ago once past 24 hours, up to a week", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(relativeTime(twoDaysAgo)).toBe("2d ago");
  });

  it("falls back to a formatted date once past a week", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60_000).toISOString();
    expect(relativeTime(tenDaysAgo)).not.toMatch(/ago$/);
  });
});

describe("cn", () => {
  it("joins truthy class names and drops falsy ones", () => {
    expect(cn("a", false, undefined, "b", null)).toBe("a b");
  });
});
