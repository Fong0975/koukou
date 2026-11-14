// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  formatDays,
  formatReserve,
  formatReserveDetail,
  formatSchedule,
  formatSubscriptionStatus,
} from "./subscription";

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

describe("formatSubscriptionStatus", () => {
  const tests = [
    { name: "paused until a day", status: { kind: "paused", until: "2026-04-30" }, expected: "暫停中・至 2026/04/30" },
    { name: "ended on a day", status: { kind: "ended", endDate: "2026-06-30" }, expected: "已到期・2026/06/30" },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatSubscriptionStatus(tt.status)).toBe(tt.expected);
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
      expected: { amount: "NT$ 84", average: "NT$ 83.3" },
    },
    {
      name: "whole average reads the same as the amount",
      currency: "TWD",
      reserveCents: 10000,
      averageCents: 10000,
      expected: { amount: "NT$ 100", average: "NT$ 100" },
    },
    {
      name: "average rounding up to a whole number keeps one decimal",
      currency: "TWD",
      reserveCents: 8400,
      averageCents: 100750 / 12,
      expected: { amount: "NT$ 84", average: "NT$ 84.0" },
    },
    {
      name: "groups thousands",
      currency: "TWD",
      reserveCents: 125000,
      averageCents: 1499880 / 12,
      expected: { amount: "NT$ 1,250", average: "NT$ 1,249.9" },
    },
    {
      name: "USD shows a whole amount without cents",
      currency: "USD",
      reserveCents: 900,
      averageCents: 9999 / 12,
      expected: { amount: "US$ 9", average: "US$ 8.3" },
    },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatReserve(tt.currency, tt.reserveCents, tt.averageCents)).toEqual(tt.expected);
    });
  }
});

describe("formatReserveDetail", () => {
  const tests = [
    {
      name: "first installment",
      chargeYear: 2026,
      installment: 1,
      average: "NT$ 83.3",
      expected: { full: ["2026 年度", "第 1/12 期", "月均 NT$ 83.3"], compact: ["2026 年 1/12 期", "NT$ 83.3/月"] },
    },
    {
      name: "a middle installment of a foreign reserve",
      chargeYear: 2027,
      installment: 3,
      average: "US$ 8.3",
      expected: { full: ["2027 年度", "第 3/12 期", "月均 US$ 8.3"], compact: ["2027 年 3/12 期", "US$ 8.3/月"] },
    },
    {
      name: "last installment",
      chargeYear: 2027,
      installment: 12,
      average: "NT$ 100",
      expected: { full: ["2027 年度", "第 12/12 期", "月均 NT$ 100"], compact: ["2027 年 12/12 期", "NT$ 100/月"] },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatReserveDetail(tt.chargeYear, tt.installment, tt.average)).toEqual(tt.expected);
    });
  }
});
