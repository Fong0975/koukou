import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { BillingScheduleDto } from "@/types/dto";
import { isActiveOn, monthOccurrences, scheduleDaysInMonth, yearOccurrences } from "./billingOccurrences";
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
    {
      name: "still charges on the contract end date and stops after it",
      items: [{ ...gym, contractEndDate: "2026-06-13" }],
      month: { year: 2026, month: 6 },
      expected: [
        { day: 6, name: "Gym", scheduleId: 30, amount: "100.00" },
        { day: 13, name: "Gym", scheduleId: 30, amount: "100.00" },
      ],
    },
    {
      name: "a month after the contract end date has no charges",
      items: [{ ...gym, contractEndDate: "2026-06-13" }],
      month: { year: 2026, month: 7 },
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
    amount: "500.00",
    startDate: "2026-02-01",
    schedules: [rule({ id: 20, cycle: "YEARLY", month: 3, dayOfMonth: 1 })],
  });
  const gym = makeSubscription({
    id: 3,
    name: "Gym",
    amount: "100.00",
    startDate: "2026-02-01",
    schedules: [
      rule({ id: 30, cycle: "YEARLY", month: 1, dayOfMonth: 5 }),
      rule({ id: 31, cycle: "MONTHLY", dayOfMonth: 20 }),
    ],
  });
  const leapDay = makeSubscription({
    id: 4,
    name: "Leap",
    schedules: [rule({ id: 40, cycle: "YEARLY", month: 2, dayOfMonth: 29 })],
  });
  const repriced = makeSubscription({
    id: 5,
    name: "Repriced",
    startDate: "2026-03-15",
    amountPeriods: [{ id: 1, amount: "330.00", endDate: "2026-06-30" }],
    schedules: [rule({ id: 50, dayOfMonth: 1 })],
  });
  /** One charge per month from `from` through December. */
  const laterMonths = (from: number, day: string, amount: string) =>
    Array.from({ length: 13 - from }, (_, index) => `2026-${String(from + index).padStart(2, "0")}-${day} ${amount}`);

  const tests = [
    { name: "no subscriptions", items: [], year: 2026, expected: [] },
    { name: "a yearly charge appears once", items: [domain], year: 2026, expected: ["2026-03-01 500.00"] },
    {
      name: "covers every month in date order and skips days before the start date",
      items: [gym, domain],
      year: 2026,
      expected: ["2026-02-20 100.00", "2026-03-01 500.00", "2026-03-20 100.00", ...laterMonths(4, "20", "100.00")],
    },
    {
      name: "Feb 29 still charges once in a common year",
      items: [leapDay],
      year: 2026,
      expected: ["2026-02-28 390.00"],
    },
    {
      // March 1st is before the start date; April–June charge 330, July–December 390.
      name: "follows the start date and past amounts",
      items: [repriced],
      year: 2026,
      expected: ["2026-04-01 330.00", "2026-05-01 330.00", "2026-06-01 330.00", ...laterMonths(7, "01", "390.00")],
    },
    { name: "a year before the start date has no charges", items: [domain], year: 2025, expected: [] },
    {
      name: "stops after the contract end date",
      items: [{ ...repriced, contractEndDate: "2026-08-01" }],
      year: 2026,
      expected: [
        "2026-04-01 330.00",
        "2026-05-01 330.00",
        "2026-06-01 330.00",
        "2026-07-01 390.00",
        "2026-08-01 390.00",
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(yearOccurrences(tt.items, tt.year).map((o) => `${o.date} ${o.amount}`)).toEqual(tt.expected);
    });
  }
});

describe("isActiveOn", () => {
  const tests = [
    { name: "before the start date", contractEndDate: null, date: "2025-12-31", expected: false },
    { name: "on the start date", contractEndDate: null, date: "2026-01-01", expected: true },
    { name: "far ahead without a contract end date", contractEndDate: null, date: "2099-01-01", expected: true },
    { name: "on the contract end date", contractEndDate: "2026-06-30", date: "2026-06-30", expected: true },
    { name: "the day after the contract end date", contractEndDate: "2026-06-30", date: "2026-07-01", expected: false },
    { name: "a contract ending on the start date", contractEndDate: "2026-01-01", date: "2026-01-01", expected: true },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isActiveOn({ startDate: "2026-01-01", contractEndDate: tt.contractEndDate }, tt.date)).toBe(tt.expected);
    });
  }
});
