import { describe, expect, it } from "vitest";
import {
  dateStringInTimeZone,
  endOfDateStringInTimeZone,
  isValidTimeZone,
  nextDateString,
  startOfDateStringInTimeZone,
} from "../../src/utils/timezone";

describe("timezone day-boundary math", () => {
  it("computes local midnight for a zone with no DST (Kolkata, UTC+5:30)", () => {
    expect(startOfDateStringInTimeZone("2026-08-19", "Asia/Kolkata").toISOString()).toBe("2026-08-18T18:30:00.000Z");
  });

  it("computes local midnight for New York during EDT (UTC-4)", () => {
    expect(startOfDateStringInTimeZone("2026-08-19", "America/New_York").toISOString()).toBe(
      "2026-08-19T04:00:00.000Z",
    );
  });

  it("computes local midnight for New York during EST (UTC-5)", () => {
    expect(startOfDateStringInTimeZone("2026-01-19", "America/New_York").toISOString()).toBe(
      "2026-01-19T05:00:00.000Z",
    );
  });

  it("is a no-op offset for UTC itself", () => {
    expect(startOfDateStringInTimeZone("2026-08-19", "UTC").toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });

  it("handles the world's farthest-ahead zone (Kiritimati, UTC+14)", () => {
    expect(startOfDateStringInTimeZone("2026-08-19", "Pacific/Kiritimati").toISOString()).toBe(
      "2026-08-18T10:00:00.000Z",
    );
  });

  it("produces a 23-hour day across a spring-forward DST transition", () => {
    const start = startOfDateStringInTimeZone("2026-03-08", "America/New_York");
    const end = endOfDateStringInTimeZone("2026-03-08", "America/New_York");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });

  it("produces a 25-hour day across a fall-back DST transition", () => {
    const start = startOfDateStringInTimeZone("2026-11-01", "America/New_York");
    const end = endOfDateStringInTimeZone("2026-11-01", "America/New_York");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(25);
  });

  it("dateStringInTimeZone reflects the target zone's calendar date, not UTC's", () => {
    // 20:00 UTC is already 01:30 the next day in Kolkata (+5:30).
    const instant = new Date("2026-08-18T20:00:00.000Z");
    expect(dateStringInTimeZone("Asia/Kolkata", instant)).toBe("2026-08-19");
    expect(dateStringInTimeZone("UTC", instant)).toBe("2026-08-18");
  });

  it("nextDateString rolls over month and year boundaries", () => {
    expect(nextDateString("2026-08-19")).toBe("2026-08-20");
    expect(nextDateString("2026-08-31")).toBe("2026-09-01");
    expect(nextDateString("2026-12-31")).toBe("2027-01-01");
  });

  it("validates real IANA zones and rejects garbage", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
  });
});
