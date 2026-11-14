// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CalendarDate } from "./calendarMonth";
import {
  addDays,
  dateKeyToUtcDate,
  dateKeyToYearMonth,
  daysUntil,
  isDateKey,
  localClockTime,
  localDateKey,
  msUntilNextLocalMidnight,
  pad2,
  toDateKey,
  todayKey,
  utcDateToDateKey,
} from "./dateKey";

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

describe("dateKeyToYearMonth", () => {
  const tests = [
    { name: "reads the year and month", key: "2026-10-17", expected: { year: 2026, month: 10 } },
    { name: "drops the leading zero of the month", key: "2027-01-01", expected: { year: 2027, month: 1 } },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(dateKeyToYearMonth(tt.key)).toEqual(tt.expected);
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

describe("daysUntil", () => {
  const today: CalendarDate = { year: 2026, month: 10, day: 18 };
  const tests = [
    { name: "today", date: "2026-10-18", expected: 0 },
    { name: "tomorrow", date: "2026-10-19", expected: 1 },
    { name: "across a month end", date: "2026-11-02", expected: 15 },
    { name: "across a year end", date: "2027-01-01", expected: 75 },
    { name: "yesterday", date: "2026-10-17", expected: -1 },
    { name: "earlier in the month", date: "2026-10-01", expected: -17 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(daysUntil(today, tt.date)).toBe(tt.expected);
    });
  }
});

describe("pad2", () => {
  const tests = [
    { name: "pads a single digit", value: 5, expected: "05" },
    { name: "keeps two digits", value: 12, expected: "12" },
    { name: "pads zero", value: 0, expected: "00" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(pad2(tt.value)).toBe(tt.expected);
    });
  }
});

describe("localDateKey", () => {
  const tests = [
    { name: "uses the local date late in the day", date: new Date(2026, 9, 17, 23, 59), expected: "2026-10-17" },
    { name: "pads month and day", date: new Date(2026, 0, 5, 0, 0), expected: "2026-01-05" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(localDateKey(tt.date)).toBe(tt.expected);
    });
  }
});

describe("localClockTime", () => {
  const tests = [
    { name: "pads hours and minutes", date: new Date(2026, 9, 17, 8, 5), expected: "08:05" },
    { name: "uses a 24-hour clock", date: new Date(2026, 9, 17, 23, 59), expected: "23:59" },
    { name: "midnight", date: new Date(2026, 9, 17, 0, 0), expected: "00:00" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(localClockTime(tt.date)).toBe(tt.expected);
    });
  }
});

describe("msUntilNextLocalMidnight", () => {
  const HOUR = 60 * 60 * 1000;
  const tests = [
    { name: "one hour before midnight", now: new Date(2026, 9, 17, 23, 0), expected: HOUR },
    { name: "a full day right after midnight", now: new Date(2026, 9, 17, 0, 0), expected: 24 * HOUR },
    { name: "across a month end", now: new Date(2026, 9, 31, 22, 0), expected: 2 * HOUR },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(msUntilNextLocalMidnight(tt.now)).toBe(tt.expected);
    });
  }
});
