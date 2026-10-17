import { describe, expect, it } from "vitest";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { BillingScheduleDto } from "@/types/dto";
import { monthOccurrences, occurrencesByDay, scheduleDaysInMonth, yearOccurrences } from "./billingOccurrences";
import { toDateKey } from "./dateKey";

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
    amount: "500.00",
    schedules: [rule({ id: 20, cycle: "YEARLY", month: 3, dayOfMonth: 1 })],
  });
  const gym = makeSubscription({
    id: 3,
    name: "Gym",
    amount: "150.00",
    startDate: "2026-05-10",
    amountPeriods: [{ id: 1, amount: "100.00", endDate: "2026-06-20" }],
    schedules: [rule({ id: 30, cycle: "WEEKLY", dayOfWeek: 6 })],
  });

  // Saturdays: May 9/16/23/30 and June 6/13/20/27, 2026.
  const tests = [
    {
      name: "expands every schedule and orders by day, keeping input order on ties",
      items: [netflix, domain],
      month: { year: 2026, month: 3 },
      expected: [
        { day: 1, name: "Netflix", scheduleId: 11, amount: "390.00" },
        { day: 1, name: "Domain", scheduleId: 20, amount: "500.00" },
        { day: 15, name: "Netflix", scheduleId: 10, amount: "390.00" },
      ],
    },
    {
      name: "skips subscriptions that do not charge that month",
      items: [netflix, domain],
      month: { year: 2026, month: 4 },
      expected: [
        { day: 1, name: "Netflix", scheduleId: 11, amount: "390.00" },
        { day: 15, name: "Netflix", scheduleId: 10, amount: "390.00" },
      ],
    },
    {
      name: "skips days before the start date",
      items: [gym],
      month: { year: 2026, month: 5 },
      expected: [
        { day: 16, name: "Gym", scheduleId: 30, amount: "100.00" },
        { day: 23, name: "Gym", scheduleId: 30, amount: "100.00" },
        { day: 30, name: "Gym", scheduleId: 30, amount: "100.00" },
      ],
    },
    {
      name: "prices each day with the amount period covering it",
      items: [gym],
      month: { year: 2026, month: 6 },
      expected: [
        { day: 6, name: "Gym", scheduleId: 30, amount: "100.00" },
        { day: 13, name: "Gym", scheduleId: 30, amount: "100.00" },
        { day: 20, name: "Gym", scheduleId: 30, amount: "100.00" },
        { day: 27, name: "Gym", scheduleId: 30, amount: "150.00" },
      ],
    },
    {
      name: "a month before the start date has no charges",
      items: [gym],
      month: { year: 2026, month: 4 },
      expected: [],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = monthOccurrences(tt.items, tt.month);

      expect(
        result.map((o) => ({ day: o.day, name: o.subscription.name, scheduleId: o.scheduleId, amount: o.amount })),
      ).toEqual(tt.expected);
      expect(result.map((o) => o.date)).toEqual(tt.expected.map(({ day }) => toDateKey({ ...tt.month, day })));
    });
  }
});

describe("yearOccurrences", () => {
  const domain = makeSubscription({
    id: 2,
    name: "Domain",
    startDate: "2026-02-01",
    schedules: [rule({ id: 20, cycle: "YEARLY", month: 3, dayOfMonth: 1 })],
  });
  const gym = makeSubscription({
    id: 3,
    name: "Gym",
    startDate: "2026-02-01",
    schedules: [
      rule({ id: 30, cycle: "YEARLY", month: 1, dayOfMonth: 5 }),
      rule({ id: 31, cycle: "MONTHLY", dayOfMonth: 20 }),
    ],
  });

  const tests = [
    { name: "no subscriptions", items: [], year: 2026, expected: [] },
    { name: "a yearly charge appears once", items: [domain], year: 2026, expected: ["2026-03-01"] },
    {
      name: "covers every month in date order and skips days before the start date",
      items: [gym, domain],
      year: 2026,
      expected: [
        "2026-02-20",
        "2026-03-01",
        "2026-03-20",
        ...["04", "05", "06", "07", "08", "09", "10", "11", "12"].map((month) => `2026-${month}-20`),
      ],
    },
    { name: "a year before the start date has no charges", items: [domain], year: 2025, expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(yearOccurrences(tt.items, tt.year).map((o) => o.date)).toEqual(tt.expected);
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
        makeOccurrence(1, a, { scheduleId: 10 }),
        makeOccurrence(5, b, { scheduleId: 20 }),
        makeOccurrence(1, b, { scheduleId: 21 }),
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
