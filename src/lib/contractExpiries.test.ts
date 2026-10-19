// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import type { CalendarDate, YearMonth } from "./calendarMonth";
import { daysUntil, monthContractExpiries } from "./contractExpiries";

describe("monthContractExpiries", () => {
  const phone = makeSubscription({ id: 1, name: "Phone", contractEndDate: "2026-10-31" });
  const gym = makeSubscription({ id: 2, name: "Gym", contractEndDate: "2026-10-05" });
  const insurance = makeSubscription({ id: 3, name: "Insurance", contractEndDate: "2026-10-31" });
  const open = makeSubscription({ id: 4, name: "Netflix", contractEndDate: null });
  const nextYear = makeSubscription({ id: 5, name: "Domain", contractEndDate: "2027-10-15" });

  const tests: { name: string; items: SubscriptionDto[]; target: YearMonth; expected: [string, number, string][] }[] = [
    { name: "no subscriptions", items: [], target: { year: 2026, month: 10 }, expected: [] },
    {
      name: "skips subscriptions without a contract end date or ending in another month",
      items: [open, nextYear],
      target: { year: 2026, month: 10 },
      expected: [],
    },
    {
      name: "orders by day, then by name",
      items: [phone, open, insurance, gym],
      target: { year: 2026, month: 10 },
      expected: [
        ["Gym", 5, "2026-10-05"],
        ["Insurance", 31, "2026-10-31"],
        ["Phone", 31, "2026-10-31"],
      ],
    },
    {
      name: "matches the same month of another year only in that year",
      items: [nextYear],
      target: { year: 2027, month: 10 },
      expected: [["Domain", 15, "2027-10-15"]],
    },
    { name: "a different month has none", items: [phone], target: { year: 2026, month: 11 }, expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = monthContractExpiries(tt.items, tt.target);

      expect(result.map((expiry) => [expiry.subscription.name, expiry.day, expiry.date])).toEqual(tt.expected);
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
