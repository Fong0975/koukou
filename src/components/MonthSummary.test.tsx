import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import type { CurrencyTotals } from "@/lib/billingSummary";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto } from "@/types/dto";
import { MonthSummary } from "./MonthSummary";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49" });

const mixedMonth = [
  makeOccurrence(1, netflix, { scheduleId: 10 }),
  makeOccurrence(1, spotify, { scheduleId: 20 }),
  makeOccurrence(15, netflix, { scheduleId: 11 }),
];

describe("MonthSummary", () => {
  const tests: {
    name: string;
    occurrences: Occurrence[];
    yearTotal: CurrencyTotals;
    yearTwdCents?: number;
    rates?: ExchangeRateDto[];
    expectedHeadline: string[];
    expectedYear: string;
    expectedTexts: string[];
    expectedGroups: boolean;
  }[] = [
    {
      name: "an empty month shows zero and hides the breakdowns",
      occurrences: [],
      yearTotal: {},
      expectedHeadline: ["NT$ 0"],
      expectedYear: "NT$ 0",
      expectedTexts: ["共 0 次扣款，來自 0 個項目", "2026 年度總計"],
      expectedGroups: false,
    },
    {
      name: "without rates totals per currency, counts, breakdowns and the year total",
      occurrences: mixedMonth,
      yearTotal: { TWD: 936000, USD: 18588 },
      expectedHeadline: ["NT$ 780", "US$ 15.49"],
      expectedYear: "NT$ 9,360US$ 185.88",
      expectedTexts: ["共 3 次扣款，來自 2 個項目"],
      expectedGroups: true,
    },
    {
      // 15.49 × 32 = 495.68 → 496; 780 + 496 = 1,276.
      name: "with rates shows the totals in TWD followed by what they were converted from",
      occurrences: mixedMonth,
      yearTotal: { TWD: 936000, USD: 18588 },
      yearTwdCents: 1530800,
      rates: [{ date: "2026-01-01", rate: 32 }],
      expectedHeadline: ["NT$ 1,276", "(NT$ 780, US$ 15.49)"],
      expectedYear: "NT$ 15,308(NT$ 9,360, US$ 185.88)",
      expectedTexts: ["共 3 次扣款，來自 2 個項目"],
      expectedGroups: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <MonthSummary
          occurrences={tt.occurrences}
          year={2026}
          yearTotal={tt.yearTotal}
          yearTwdCents={tt.yearTwdCents ?? null}
          rates={tt.rates ?? null}
        />,
      );

      expect(screen.getByRole("heading", { name: "本月總結" })).toBeInTheDocument();
      const headline = screen.getByText("本月總計").nextElementSibling;
      expect([...(headline?.children ?? [])].map((line) => line.textContent)).toEqual(tt.expectedHeadline);
      expect(screen.getByText("2026 年度總計").nextElementSibling).toHaveTextContent(tt.expectedYear);
      for (const text of tt.expectedTexts) expect(screen.getByText(text)).toBeInTheDocument();
      for (const name of ["依類別", "依付款方式", "信用卡"]) {
        const heading = screen.queryByRole("heading", { name });
        if (tt.expectedGroups) expect(heading).toBeInTheDocument();
        else expect(heading).not.toBeInTheDocument();
      }
    });
  }
});
