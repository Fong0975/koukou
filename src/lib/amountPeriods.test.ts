// @vitest-environment node
import { describe, expect, it } from "vitest";
import { amountOn, amountPeriodRanges } from "./amountPeriods";

describe("amountOn", () => {
  const history = {
    amount: "150.00",
    amountPeriods: [
      { id: 1, amount: "100.00", endDate: "2026-03-20" },
      { id: 2, amount: "120.00", endDate: "2026-06-30" },
    ],
  };

  const tests = [
    { name: "before the first end date uses the first period", date: "2026-01-01", expected: "100.00" },
    { name: "an end date itself still uses that period", date: "2026-03-20", expected: "100.00" },
    { name: "the day after an end date uses the next period", date: "2026-03-21", expected: "120.00" },
    { name: "after the last end date uses the current amount", date: "2026-07-01", expected: "150.00" },
    {
      name: "without past amounts always uses the current amount",
      date: "2026-01-01",
      history: { amount: "150.00", amountPeriods: [] },
      expected: "150.00",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(amountOn(tt.history ?? history, tt.date)).toBe(tt.expected);
    });
  }
});

describe("amountPeriodRanges", () => {
  const tests = [
    {
      name: "without periods the current amount starts on the start date",
      periods: [],
      expectedRanges: [],
      expectedCurrentStart: "2026-01-15",
    },
    {
      name: "chains periods by end date, whatever the input order",
      periods: [
        { key: "b", endDate: "2026-06-30" },
        { key: "a", endDate: "2026-03-20" },
      ],
      expectedRanges: [
        { key: "a", start: "2026-01-15" },
        { key: "b", start: "2026-03-21" },
      ],
      expectedCurrentStart: "2026-07-01",
    },
    {
      name: "rolls over month and year ends",
      periods: [{ key: "a", endDate: "2026-12-31" }],
      expectedRanges: [{ key: "a", start: "2026-01-15" }],
      expectedCurrentStart: "2027-01-01",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { ranges, currentStart } = amountPeriodRanges("2026-01-15", tt.periods);
      expect(ranges.map(({ period, start }) => ({ key: period.key, start }))).toEqual(tt.expectedRanges);
      expect(currentStart).toBe(tt.expectedCurrentStart);
    });
  }
});
