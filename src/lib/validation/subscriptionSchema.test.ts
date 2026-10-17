// @vitest-environment node
import { describe, expect, it } from "vitest";
import { subscriptionInputSchema } from "./subscriptionSchema";

const valid = {
  name: "  Netflix  ",
  categoryId: 1,
  paymentMethodId: "2",
  currency: "USD",
  amount: "15.49",
  startDate: "2026-01-15",
  note: "",
  schedules: [{ cycle: "MONTHLY", dayOfMonth: 1 }],
};

describe("subscriptionInputSchema", () => {
  const tests: {
    name: string;
    input: Record<string, unknown>;
    expected?: Record<string, unknown>;
    errorPath?: string;
  }[] = [
    {
      name: "normalizes a valid payload",
      input: valid,
      expected: {
        name: "Netflix",
        categoryId: 1,
        paymentMethodId: 2,
        currency: "USD",
        amount: 15.49,
        amortize: false,
        startDate: "2026-01-15",
        amountPeriods: [],
        note: null,
      },
    },
    {
      name: "keeps amortize when enabled",
      input: { ...valid, amortize: true, schedules: [{ cycle: "YEARLY", month: 10, dayOfMonth: 11 }] },
      expected: { amortize: true },
    },
    { name: "rejects non-boolean amortize", input: { ...valid, amortize: "yes" }, errorPath: "amortize" },
    {
      name: "accepts past amounts ending on or after the start date",
      input: {
        ...valid,
        amountPeriods: [
          { amount: "12.99", endDate: "2026-01-15" },
          { amount: "13.99", endDate: "2026-06-30" },
        ],
      },
      expected: {
        amountPeriods: [
          { amount: 12.99, endDate: "2026-01-15" },
          { amount: 13.99, endDate: "2026-06-30" },
        ],
      },
    },
    { name: "rejects missing start date", input: { ...valid, startDate: undefined }, errorPath: "startDate" },
    { name: "rejects invalid start date", input: { ...valid, startDate: "2026-13-01" }, errorPath: "startDate" },
    {
      name: "rejects a past amount ending before the start date",
      input: { ...valid, amountPeriods: [{ amount: 10, endDate: "2026-01-14" }] },
      errorPath: "amountPeriods.0.endDate",
    },
    {
      name: "rejects duplicate past amount end dates",
      input: {
        ...valid,
        amountPeriods: [
          { amount: 10, endDate: "2026-03-01" },
          { amount: 11, endDate: "2026-03-01" },
        ],
      },
      errorPath: "amountPeriods.1.endDate",
    },
    { name: "defaults currency to TWD", input: { ...valid, currency: undefined }, expected: { currency: "TWD" } },
    { name: "keeps a trimmed note", input: { ...valid, note: " 家庭方案 " }, expected: { note: "家庭方案" } },
    { name: "accepts 2-decimal float edge", input: { ...valid, amount: 19.99 }, expected: { amount: 19.99 } },
    { name: "accepts integer amount", input: { ...valid, amount: 300 }, expected: { amount: 300 } },
    { name: "rejects blank name", input: { ...valid, name: "   " }, errorPath: "name" },
    { name: "rejects too long name", input: { ...valid, name: "a".repeat(101) }, errorPath: "name" },
    { name: "rejects unsupported currency", input: { ...valid, currency: "JPY" }, errorPath: "currency" },
    { name: "rejects zero amount", input: { ...valid, amount: 0 }, errorPath: "amount" },
    { name: "rejects negative amount", input: { ...valid, amount: -1 }, errorPath: "amount" },
    { name: "rejects 3 decimals", input: { ...valid, amount: "1.005" }, errorPath: "amount" },
    { name: "rejects non-numeric amount", input: { ...valid, amount: "abc" }, errorPath: "amount" },
    { name: "rejects amount above DECIMAL(12,2)", input: { ...valid, amount: 1e10 }, errorPath: "amount" },
    { name: "rejects invalid categoryId", input: { ...valid, categoryId: 0 }, errorPath: "categoryId" },
    {
      name: "rejects categoryId above INT range",
      input: { ...valid, categoryId: 2_147_483_648 },
      errorPath: "categoryId",
    },
    {
      name: "rejects missing paymentMethodId",
      input: { ...valid, paymentMethodId: undefined },
      errorPath: "paymentMethodId",
    },
    { name: "rejects empty schedules", input: { ...valid, schedules: [] }, errorPath: "schedules" },
    {
      name: "rejects invalid nested schedule",
      input: { ...valid, schedules: [{ cycle: "WEEKLY" }] },
      errorPath: "schedules.0.dayOfWeek",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = subscriptionInputSchema.safeParse(tt.input);
      if (tt.errorPath) {
        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(tt.errorPath);
      } else {
        expect(result.success).toBe(true);
        expect(result.data).toMatchObject(tt.expected!);
      }
    });
  }
});
