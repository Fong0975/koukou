import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Reserve } from "@/lib/amortization";
import type { Occurrence } from "@/lib/billingOccurrences";
import type { CurrencyTotals } from "@/lib/billingSummary";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import { MonthSummary } from "./MonthSummary";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49" });
const domain = makeSubscription({ id: 3, name: "網域", currency: "TWD", amount: "1000.00", amortize: true });
const domainReserve: Reserve = {
  key: "3-30",
  subscription: domain,
  chargeDate: { year: 2027, month: 10, day: 11 },
  reserveCents: 8400,
  averageCents: 100000 / 12,
};

describe("MonthSummary", () => {
  const tests: {
    name: string;
    occurrences: Occurrence[];
    reserves?: Reserve[];
    yearTotal: CurrencyTotals;
    expectedHeadline: string[];
    expectedTexts: string[];
    expectedGroups: boolean;
    expectedReserves?: boolean;
  }[] = [
    {
      name: "an empty month shows zero and hides the breakdowns",
      occurrences: [],
      yearTotal: {},
      expectedHeadline: ["NT$ 0"],
      expectedTexts: ["共 0 次扣款，來自 0 個項目", "2026 年度總計"],
      expectedGroups: false,
    },
    {
      name: "totals per currency, counts, breakdowns and the year total",
      occurrences: [
        makeOccurrence(1, netflix, { scheduleId: 10 }),
        makeOccurrence(1, spotify, { scheduleId: 20 }),
        makeOccurrence(15, netflix, { scheduleId: 11 }),
      ],
      yearTotal: { TWD: 936000, USD: 18588 },
      expectedHeadline: ["NT$ 780", "US$ 15.49"],
      expectedTexts: ["共 3 次扣款，來自 2 個項目", "NT$ 9,360", "US$ 185.88"],
      expectedGroups: true,
    },
    {
      name: "reserves show in their own block and stay out of the month total",
      occurrences: [makeOccurrence(1, netflix, { scheduleId: 10 })],
      reserves: [domainReserve],
      yearTotal: { TWD: 468000 },
      expectedHeadline: ["NT$ 390"],
      expectedTexts: ["共 1 次扣款，來自 1 個項目", "2027 年期（10/11 扣款）", "NT$ 84 (83.3)", "預留小計"],
      expectedGroups: true,
      expectedReserves: true,
    },
    {
      name: "reserves show even in a month without charges",
      occurrences: [],
      reserves: [domainReserve],
      yearTotal: {},
      expectedHeadline: ["NT$ 0"],
      expectedTexts: ["共 0 次扣款，來自 0 個項目", "NT$ 84 (83.3)"],
      expectedGroups: false,
      expectedReserves: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <MonthSummary occurrences={tt.occurrences} reserves={tt.reserves ?? []} year={2026} yearTotal={tt.yearTotal} />,
      );

      expect(screen.getByRole("heading", { name: "本月總結" })).toBeInTheDocument();
      const headline = screen.getByText("本月總計").nextElementSibling;
      expect([...(headline?.children ?? [])].map((line) => line.textContent)).toEqual(tt.expectedHeadline);
      for (const text of tt.expectedTexts) expect(screen.getByText(text)).toBeInTheDocument();
      for (const title of ["依類別", "依付款方式"]) {
        const list = screen.queryByRole("list", { name: title });
        if (tt.expectedGroups) expect(list).toBeInTheDocument();
        else expect(list).not.toBeInTheDocument();
      }
      const reserveList = screen.queryByRole("list", { name: "預扣款項" });
      if (tt.expectedReserves) expect(reserveList).toBeInTheDocument();
      else expect(reserveList).not.toBeInTheDocument();
    });
  }
});
