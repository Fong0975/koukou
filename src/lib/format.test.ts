// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatAmount, formatCents, formatDays, formatReserve, formatReserveTerm, formatSchedule } from "./format";

describe("formatAmount", () => {
  const tests = [
    { name: "TWD integer hides cents", currency: "TWD", amount: "390.00", expected: { prefix: "NT$", value: "390" } },
    { name: "TWD groups thousands", currency: "TWD", amount: "12900.00", expected: { prefix: "NT$", value: "12,900" } },
    {
      name: "TWD with cents keeps 2 decimals",
      currency: "TWD",
      amount: "99.50",
      expected: { prefix: "NT$", value: "99.50" },
    },
    { name: "USD always shows cents", currency: "USD", amount: "20.00", expected: { prefix: "US$", value: "20.00" } },
    { name: "USD with cents", currency: "USD", amount: "15.49", expected: { prefix: "US$", value: "15.49" } },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatAmount(tt.currency, tt.amount)).toEqual(tt.expected);
    });
  }
});

describe("formatSchedule", () => {
  const tests = [
    { name: "daily", schedule: { cycle: "DAILY", dayOfWeek: null, dayOfMonth: null, month: null }, expected: "每天" },
    {
      name: "weekly Sunday",
      schedule: { cycle: "WEEKLY", dayOfWeek: 0, dayOfMonth: null, month: null },
      expected: "每週日",
    },
    {
      name: "weekly Wednesday",
      schedule: { cycle: "WEEKLY", dayOfWeek: 3, dayOfMonth: null, month: null },
      expected: "每週三",
    },
    {
      name: "monthly",
      schedule: { cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null },
      expected: "每月 15 日",
    },
    {
      name: "yearly",
      schedule: { cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 1, month: 3 },
      expected: "每年 3 月 1 日",
    },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatSchedule(tt.schedule)).toBe(tt.expected);
    });
  }
});

describe("formatCents", () => {
  const tests = [
    { name: "TWD whole amount", currency: "TWD", cents: 129000, expected: "NT$ 1,290" },
    { name: "TWD zero", currency: "TWD", cents: 0, expected: "NT$ 0" },
    { name: "TWD with cents", currency: "TWD", cents: 9950, expected: "NT$ 99.50" },
    { name: "USD keeps cents", currency: "USD", cents: 4647, expected: "US$ 46.47" },
    { name: "USD whole amount still shows cents", currency: "USD", cents: 2000, expected: "US$ 20.00" },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatCents(tt.currency, tt.cents)).toBe(tt.expected);
    });
  }
});

describe("formatDays", () => {
  const tests = [
    { name: "single day", days: [5], expected: "5 日" },
    { name: "several days", days: [1, 15, 28], expected: "1、15、28 日" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatDays(tt.days)).toBe(tt.expected);
    });
  }
});

describe("formatReserve", () => {
  const tests = [
    {
      name: "TWD fractional average shows the rounded-up amount and the average",
      currency: "TWD",
      reserveCents: 8400,
      averageCents: 100000 / 12,
      expected: "NT$ 84 (83.3)",
    },
    {
      name: "whole average shows only the amount",
      currency: "TWD",
      reserveCents: 10000,
      averageCents: 10000,
      expected: "NT$ 100",
    },
    {
      name: "average rounding up to a whole number keeps one decimal",
      currency: "TWD",
      reserveCents: 8400,
      averageCents: 100750 / 12,
      expected: "NT$ 84 (84.0)",
    },
    {
      name: "groups thousands",
      currency: "TWD",
      reserveCents: 125000,
      averageCents: 1499880 / 12,
      expected: "NT$ 1,250 (1,249.9)",
    },
    {
      name: "USD shows a whole amount without cents",
      currency: "USD",
      reserveCents: 900,
      averageCents: 9999 / 12,
      expected: "US$ 9 (8.3)",
    },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatReserve(tt.currency, tt.reserveCents, tt.averageCents)).toBe(tt.expected);
    });
  }
});

describe("formatReserveTerm", () => {
  const tests = [
    { name: "two-digit month and day", date: { year: 2026, month: 10, day: 11 }, expected: "2026 年期（10/11 扣款）" },
    { name: "single-digit month and day", date: { year: 2027, month: 3, day: 1 }, expected: "2027 年期（3/1 扣款）" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatReserveTerm(tt.date)).toBe(tt.expected);
    });
  }
});
