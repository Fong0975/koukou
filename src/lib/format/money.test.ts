// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { CurrencyTotals } from "../money";
import {
  formatAmount,
  formatAmountText,
  formatApproxTwd,
  formatCents,
  formatConvertedTotal,
  formatPercent,
  type ConvertedTotal,
} from "./money";

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

describe("formatAmountText", () => {
  const tests = [
    { name: "TWD whole amount hides cents", currency: "TWD", amount: "390.00", expected: "NT$ 390" },
    { name: "TWD with cents", currency: "TWD", amount: "99.50", expected: "NT$ 99.50" },
    { name: "TWD grouped", currency: "TWD", amount: "1290.00", expected: "NT$ 1,290" },
    { name: "USD keeps cents", currency: "USD", amount: "20.00", expected: "US$ 20.00" },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatAmountText(tt.currency, tt.amount)).toBe(tt.expected);
    });
  }
});

describe("formatConvertedTotal", () => {
  const tests: { name: string; twdCents: number; totals: CurrencyTotals; expected: ConvertedTotal }[] = [
    { name: "no charges", twdCents: 0, totals: {}, expected: { total: "NT$ 0", breakdown: [] } },
    { name: "TWD only", twdCents: 50000, totals: { TWD: 50000 }, expected: { total: "NT$ 500", breakdown: [] } },
    {
      name: "USD only",
      twdCents: 100000,
      totals: { USD: 3100 },
      expected: { total: "NT$ 1,000", breakdown: [{ amount: "US$ 31.00", twd: "NT$ 1,000" }] },
    },
    {
      name: "TWD and USD",
      twdCents: 150000,
      totals: { USD: 3100, TWD: 50000 },
      expected: {
        total: "NT$ 1,500",
        breakdown: [
          { amount: "NT$ 500", twd: null },
          { amount: "US$ 31.00", twd: "NT$ 1,000" },
        ],
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatConvertedTotal(tt.twdCents, tt.totals)).toEqual(tt.expected);
    });
  }
});

describe("formatApproxTwd", () => {
  const tests = [
    { name: "whole dollars", twdCents: 100300, expected: "≈ NT$ 1,003" },
    { name: "zero", twdCents: 0, expected: "≈ NT$ 0" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatApproxTwd(tt.twdCents)).toBe(tt.expected);
    });
  }
});

describe("formatPercent", () => {
  const tests = [
    { name: "rounds to a whole percent", share: 0.4249, expected: "42%" },
    { name: "whole", share: 1, expected: "100%" },
    { name: "zero", share: 0, expected: "0%" },
    { name: "a sliver", share: 0.004, expected: "<1%" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatPercent(tt.share)).toBe(tt.expected);
    });
  }
});
