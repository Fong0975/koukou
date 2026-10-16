import { describe, expect, it } from "vitest";
import { buildMonthGrid, daysInMonth, shiftMonth, toCalendarDate } from "./calendarMonth";

describe("daysInMonth", () => {
  const tests = [
    { name: "31-day month", year: 2026, month: 1, expected: 31 },
    { name: "30-day month", year: 2026, month: 4, expected: 30 },
    { name: "February in a common year", year: 2026, month: 2, expected: 28 },
    { name: "February in a leap year", year: 2024, month: 2, expected: 29 },
    { name: "February in a century year that is not a leap year", year: 2100, month: 2, expected: 28 },
    { name: "February in a leap century year", year: 2000, month: 2, expected: 29 },
    { name: "December", year: 2026, month: 12, expected: 31 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(daysInMonth({ year: tt.year, month: tt.month })).toBe(tt.expected);
    });
  }
});

describe("shiftMonth", () => {
  const tests = [
    { name: "zero keeps the month", from: { year: 2026, month: 5 }, delta: 0, expected: { year: 2026, month: 5 } },
    { name: "next within the year", from: { year: 2026, month: 5 }, delta: 1, expected: { year: 2026, month: 6 } },
    { name: "next across the year end", from: { year: 2026, month: 12 }, delta: 1, expected: { year: 2027, month: 1 } },
    {
      name: "previous across the year start",
      from: { year: 2026, month: 1 },
      delta: -1,
      expected: { year: 2025, month: 12 },
    },
    { name: "many months back", from: { year: 2026, month: 5 }, delta: -17, expected: { year: 2024, month: 12 } },
    { name: "many months forward", from: { year: 2026, month: 5 }, delta: 20, expected: { year: 2028, month: 1 } },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(shiftMonth(tt.from, tt.delta)).toEqual(tt.expected);
    });
  }
});

describe("toCalendarDate", () => {
  const tests = [
    {
      name: "late evening stays on the same local day",
      date: new Date(2026, 9, 16, 23, 59),
      expected: { year: 2026, month: 10, day: 16 },
    },
    { name: "first moment of the year", date: new Date(2027, 0, 1, 0, 0), expected: { year: 2027, month: 1, day: 1 } },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toCalendarDate(tt.date)).toEqual(tt.expected);
    });
  }
});

describe("buildMonthGrid", () => {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

  const tests = [
    {
      // 2026-02-01 is a Sunday and the month has 28 days.
      name: "month that fills exact weeks has no padding",
      month: { year: 2026, month: 2 },
      weeks: 4,
      firstWeek: range(1, 7),
      lastWeek: range(22, 28),
    },
    {
      // 2026-04-01 is a Wednesday.
      name: "pads before the 1st and after the last day",
      month: { year: 2026, month: 4 },
      weeks: 5,
      firstWeek: [null, null, null, 1, 2, 3, 4],
      lastWeek: [26, 27, 28, 29, 30, null, null],
    },
    {
      // 2026-08-01 is a Saturday, so 31 days need six rows.
      name: "month spanning six weeks",
      month: { year: 2026, month: 8 },
      weeks: 6,
      firstWeek: [null, null, null, null, null, null, 1],
      lastWeek: [30, 31, null, null, null, null, null],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const grid = buildMonthGrid(tt.month);

      expect(grid).toHaveLength(tt.weeks);
      for (const week of grid) expect(week).toHaveLength(7);
      expect(grid[0]).toEqual(tt.firstWeek);
      expect(grid.at(-1)).toEqual(tt.lastWeek);
      expect(grid.flat().filter((day) => day !== null)).toEqual(range(1, daysInMonth(tt.month)));
    });
  }
});
