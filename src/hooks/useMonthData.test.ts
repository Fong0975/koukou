import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { YearMonth } from "@/lib/calendarMonth";
import { makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto, SubscriptionDto } from "@/types/dto";

const { useYearRates } = vi.hoisted(() => ({ useYearRates: vi.fn() }));
vi.mock("./useYearRates", () => ({ useYearRates }));

import { useMonthData } from "./useMonthData";

const phone = makeSubscription({
  id: 1,
  name: "中華電信",
  amount: "599.00",
  contractEndDate: "2026-10-20",
  schedules: [{ id: 10, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null }],
});
const domain = makeSubscription({
  id: 2,
  name: "網域",
  amount: "1200.00",
  amortize: true,
  schedules: [{ id: 20, cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 11, month: 3 }],
});
const cloud = makeSubscription({
  id: 3,
  name: "雲端空間",
  currency: "USD",
  amount: "10.00",
  schedules: [{ id: 30, cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 1, month: 6 }],
});
const rates: ExchangeRateDto[] = [{ date: "2026-01-01", rate: 32 }];

describe("useMonthData", () => {
  beforeEach(() => useYearRates.mockReset());

  const tests: {
    name: string;
    items: SubscriptionDto[];
    cursor: YearMonth | null;
    rates?: ExchangeRateDto[];
    expected: {
      charges: string[];
      expiries: string[];
      reserves: string[];
      yearTotal: Record<string, number>;
      yearTwdCents: number | null;
    };
    expectedRateRequest: [number | undefined, boolean];
  }[] = [
    {
      name: "is empty before the month is known",
      items: [phone, domain],
      cursor: null,
      expected: { charges: [], expiries: [], reserves: [], yearTotal: {}, yearTwdCents: null },
      expectedRateRequest: [undefined, false],
    },
    {
      // The phone contract charges Jan–Oct 2026 (10 × 599) and ends on 10/20; the domain charges once on 3/11.
      name: "collects the month's charges, expiries and reserves and the year's totals",
      items: [phone, domain],
      cursor: { year: 2026, month: 10 },
      expected: {
        charges: ["2026-10-15 中華電信"],
        expiries: ["2026-10-20 中華電信"],
        reserves: ["網域"],
        yearTotal: { TWD: 719000 },
        // Without foreign charges no rates are fetched, so there is no converted total.
        yearTwdCents: null,
      },
      expectedRateRequest: [2026, false],
    },
    {
      name: "asks for rates when the year has foreign charges and converts with them",
      items: [cloud],
      cursor: { year: 2026, month: 6 },
      rates,
      expected: {
        charges: ["2026-06-01 雲端空間"],
        expiries: [],
        reserves: [],
        yearTotal: { USD: 1000 },
        yearTwdCents: 32000,
      },
      expectedRateRequest: [2026, true],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      useYearRates.mockReturnValue(tt.rates ?? null);

      const { result } = renderHook(() => useMonthData(tt.items, tt.cursor));

      const data = result.current;
      expect(data.occurrences.map((o) => `${o.date} ${o.subscription.name}`)).toEqual(tt.expected.charges);
      expect(data.expiries.map((e) => `${e.date} ${e.subscription.name}`)).toEqual(tt.expected.expiries);
      expect(data.reserves.map((r) => r.subscription.name)).toEqual(tt.expected.reserves);
      expect(data.yearTotal).toEqual(tt.expected.yearTotal);
      expect(data.yearTwdCents).toBe(tt.expected.yearTwdCents);
      expect(data.rates).toBe(tt.rates ?? null);
      expect(useYearRates).toHaveBeenLastCalledWith(...tt.expectedRateRequest);
    });
  }
});
