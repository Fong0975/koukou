// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { addDays, dateKeyToUtcDate, isDateKey, toDateKey, todayKey, utcDateToDateKey } from "./dateKey";

describe("isDateKey", () => {
  const tests = [
    { name: "valid date", value: "2026-10-17", expected: true },
    { name: "leap day in a leap year", value: "2028-02-29", expected: true },
    { name: "leap day in a common year", value: "2026-02-29", expected: false },
    { name: "day out of range", value: "2026-04-31", expected: false },
    { name: "month out of range", value: "2026-13-01", expected: false },
    { name: "missing zero padding", value: "2026-1-5", expected: false },
    { name: "timestamp", value: "2026-10-17T00:00:00Z", expected: false },
    { name: "empty", value: "", expected: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isDateKey(tt.value)).toBe(tt.expected);
    });
  }
});

describe("toDateKey", () => {
  const tests = [
    { name: "pads month and day", date: { year: 2026, month: 3, day: 5 }, expected: "2026-03-05" },
    { name: "keeps two-digit parts", date: { year: 2026, month: 12, day: 31 }, expected: "2026-12-31" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toDateKey(tt.date)).toBe(tt.expected);
    });
  }
});

describe("todayKey", () => {
  afterEach(() => vi.useRealTimers());

  const tests = [
    { name: "uses the local date", now: new Date(2026, 9, 17, 23, 59), expected: "2026-10-17" },
    { name: "rolls over at local midnight", now: new Date(2026, 9, 18, 0, 0), expected: "2026-10-18" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      vi.useFakeTimers({ now: tt.now });
      expect(todayKey()).toBe(tt.expected);
    });
  }
});

describe("addDays", () => {
  const tests = [
    { name: "next day", key: "2026-10-17", days: 1, expected: "2026-10-18" },
    { name: "rolls over a month end", key: "2026-04-30", days: 1, expected: "2026-05-01" },
    { name: "rolls over a year end", key: "2026-12-31", days: 1, expected: "2027-01-01" },
    { name: "reaches a leap day", key: "2028-02-28", days: 1, expected: "2028-02-29" },
    { name: "goes back", key: "2026-03-01", days: -1, expected: "2026-02-28" },
    { name: "zero keeps the date", key: "2026-10-17", days: 0, expected: "2026-10-17" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(addDays(tt.key, tt.days)).toBe(tt.expected);
    });
  }
});

describe("dateKeyToUtcDate / utcDateToDateKey", () => {
  const tests = [
    { name: "regular date", key: "2026-10-17" },
    { name: "year boundary", key: "2026-12-31" },
    { name: "leap day", key: "2028-02-29" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const date = dateKeyToUtcDate(tt.key);
      expect(date.toISOString()).toBe(`${tt.key}T00:00:00.000Z`);
      expect(utcDateToDateKey(date)).toBe(tt.key);
    });
  }
});
