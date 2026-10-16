import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { BillingScheduleDto } from "@/types/dto";
import { monthOccurrences, occurrencesByDay, scheduleDaysInMonth } from "./billingOccurrences";

const rule = (overrides: Partial<BillingScheduleDto>): BillingScheduleDto => ({
  id: 1,
  cycle: "MONTHLY",
  dayOfWeek: null,
  dayOfMonth: null,
  month: null,
  ...overrides,
});

describe("scheduleDaysInMonth", () => {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

  // 2026-04-01 is a Wednesday.
  const tests = [
    {
      name: "daily charges every day",
      schedule: rule({ cycle: "DAILY" }),
      month: { year: 2026, month: 4 },
      expected: range(1, 30),
    },
    {
      name: "weekly on the weekday of the 1st",
      schedule: rule({ cycle: "WEEKLY", dayOfWeek: 3 }),
      month: { year: 2026, month: 4 },
      expected: [1, 8, 15, 22, 29],
    },
    {
      name: "weekly on a weekday before the 1st's",
      schedule: rule({ cycle: "WEEKLY", dayOfWeek: 2 }),
      month: { year: 2026, month: 4 },
      expected: [7, 14, 21, 28],
    },
    {
      name: "weekly on Sunday",
      schedule: rule({ cycle: "WEEKLY", dayOfWeek: 0 }),
      month: { year: 2026, month: 4 },
      expected: [5, 12, 19, 26],
    },
    {
      name: "monthly on an existing day",
      schedule: rule({ dayOfMonth: 15 }),
      month: { year: 2026, month: 4 },
      expected: [15],
    },
    {
      name: "monthly 31st falls on the 30th in April",
      schedule: rule({ dayOfMonth: 31 }),
      month: { year: 2026, month: 4 },
      expected: [30],
    },
    {
      name: "monthly 31st falls on the 28th in a common February",
      schedule: rule({ dayOfMonth: 31 }),
      month: { year: 2026, month: 2 },
      expected: [28],
    },
    {
      name: "monthly 31st falls on the 29th in a leap February",
      schedule: rule({ dayOfMonth: 31 }),
      month: { year: 2024, month: 2 },
      expected: [29],
    },
    {
      name: "yearly in its month",
      schedule: rule({ cycle: "YEARLY", month: 3, dayOfMonth: 1 }),
      month: { year: 2026, month: 3 },
      expected: [1],
    },
    {
      name: "yearly outside its month",
      schedule: rule({ cycle: "YEARLY", month: 3, dayOfMonth: 1 }),
      month: { year: 2026, month: 4 },
      expected: [],
    },
    {
      name: "yearly Feb 29 in a leap year",
      schedule: rule({ cycle: "YEARLY", month: 2, dayOfMonth: 29 }),
      month: { year: 2024, month: 2 },
      expected: [29],
    },
    {
      name: "yearly Feb 29 falls on the 28th in a common year",
      schedule: rule({ cycle: "YEARLY", month: 2, dayOfMonth: 29 }),
      month: { year: 2026, month: 2 },
      expected: [28],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(scheduleDaysInMonth(tt.schedule, tt.month)).toEqual(tt.expected);
    });
  }
});

describe("monthOccurrences", () => {
  const netflix = makeSubscription({
    id: 1,
    name: "Netflix",
    schedules: [rule({ id: 10, dayOfMonth: 15 }), rule({ id: 11, dayOfMonth: 1 })],
  });
  const domain = makeSubscription({
    id: 2,
    name: "Domain",
    schedules: [rule({ id: 20, cycle: "YEARLY", month: 3, dayOfMonth: 1 })],
  });

  const tests = [
    {
      name: "expands every schedule and orders by day, keeping input order on ties",
      month: { year: 2026, month: 3 },
      expected: [
        { day: 1, name: "Netflix", scheduleId: 11 },
        { day: 1, name: "Domain", scheduleId: 20 },
        { day: 15, name: "Netflix", scheduleId: 10 },
      ],
    },
    {
      name: "skips subscriptions that do not charge that month",
      month: { year: 2026, month: 4 },
      expected: [
        { day: 1, name: "Netflix", scheduleId: 11 },
        { day: 15, name: "Netflix", scheduleId: 10 },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = monthOccurrences([netflix, domain], tt.month);

      expect(result.map((o) => ({ day: o.day, name: o.subscription.name, scheduleId: o.scheduleId }))).toEqual(
        tt.expected,
      );
    });
  }
});

describe("occurrencesByDay", () => {
  const a = makeSubscription({ id: 1, name: "A" });
  const b = makeSubscription({ id: 2, name: "B" });

  const tests = [
    { name: "empty input gives an empty map", occurrences: [], expected: [] },
    {
      name: "groups by day in input order",
      occurrences: [
        { day: 1, subscription: a, scheduleId: 10 },
        { day: 5, subscription: b, scheduleId: 20 },
        { day: 1, subscription: b, scheduleId: 21 },
      ],
      expected: [
        [1, ["A", "B"]],
        [5, ["B"]],
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = [...occurrencesByDay(tt.occurrences)].map(([day, list]) => [
        day,
        list.map((o) => o.subscription.name),
      ]);

      expect(result).toEqual(tt.expected);
    });
  }
});
