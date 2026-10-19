import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto, SubscriptionDto } from "@/types/dto";

const { useYearRates } = vi.hoisted(() => ({ useYearRates: vi.fn() }));
vi.mock("./useYearRates", () => ({ useYearRates }));

import { useYearReport } from "./useYearReport";

const phone = makeSubscription({
  id: 1,
  name: "中華電信",
  amount: "599.00",
  contractEndDate: "2026-10-20",
  schedules: [{ id: 10, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null }],
});
const cloud = makeSubscription({
  id: 2,
  name: "雲端空間",
  currency: "USD",
  amount: "10.00",
  schedules: [{ id: 20, cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 1, month: 6 }],
});
const rates: ExchangeRateDto[] = [{ date: "2026-01-01", rate: 32 }];

describe("useYearReport", () => {
  beforeEach(() => useYearRates.mockReset());

  const tests: {
    name: string;
    items: SubscriptionDto[];
    year: number;
    rates?: ExchangeRateDto[];
    expected: {
      twdCents: number | null;
      chargeCount: number;
      monthTwdCents: (number | null)[];
      categories: string[];
      paymentMethods: string[];
      ranking: string[];
    };
    expectedRateRequest: [number, boolean];
  }[] = [
    {
      name: "a year without charges",
      items: [phone],
      year: 2025,
      expected: {
        twdCents: 0,
        chargeCount: 0,
        monthTwdCents: Array(12).fill(0),
        categories: [],
        paymentMethods: [],
        ranking: [],
      },
      expectedRateRequest: [2025, false],
    },
    {
      // The phone contract charges Jan–Oct 2026, so no rates are needed.
      name: "reports TWD charges without fetching rates",
      items: [phone],
      year: 2026,
      expected: {
        twdCents: 599000,
        chargeCount: 10,
        monthTwdCents: [...Array(10).fill(59900), 0, 0],
        categories: ["影音串流"],
        paymentMethods: ["國泰 CUBE"],
        ranking: ["中華電信"],
      },
      expectedRateRequest: [2026, false],
    },
    {
      name: "TWD figures wait for the rates of foreign charges",
      items: [phone, cloud],
      year: 2026,
      expected: {
        twdCents: null,
        chargeCount: 11,
        monthTwdCents: [59900, 59900, 59900, 59900, 59900, null, 59900, 59900, 59900, 59900, 0, 0],
        categories: ["影音串流"],
        paymentMethods: ["國泰 CUBE"],
        ranking: ["中華電信", "雲端空間"],
      },
      expectedRateRequest: [2026, true],
    },
    {
      name: "converts foreign charges with the year's rates",
      items: [phone, cloud],
      year: 2026,
      rates,
      expected: {
        twdCents: 599000 + 32000,
        chargeCount: 11,
        monthTwdCents: [59900, 59900, 59900, 59900, 59900, 59900 + 32000, 59900, 59900, 59900, 59900, 0, 0],
        categories: ["影音串流"],
        paymentMethods: ["國泰 CUBE"],
        ranking: ["中華電信", "雲端空間"],
      },
      expectedRateRequest: [2026, true],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      useYearRates.mockReturnValue(tt.rates ?? null);

      const { result } = renderHook(() => useYearReport(tt.items, tt.year));

      const report = result.current;
      expect(report.highlights.twdCents).toBe(tt.expected.twdCents);
      expect(report.highlights.chargeCount).toBe(tt.expected.chargeCount);
      expect(report.months.map((month) => month.twdCents)).toEqual(tt.expected.monthTwdCents);
      expect(report.byCategory.map((group) => group.label)).toEqual(tt.expected.categories);
      expect(report.byPaymentMethod.map((group) => group.label)).toEqual(tt.expected.paymentMethods);
      expect(report.ranking.map((entry) => entry.subscription.name)).toEqual(tt.expected.ranking);
      expect(report.rates).toBe(tt.rates ?? null);
      expect(useYearRates).toHaveBeenLastCalledWith(...tt.expectedRateRequest);
    });
  }
});
