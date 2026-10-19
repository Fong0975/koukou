import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import type { CurrencyTotals } from "@/lib/billingSummary";
import { expandCard } from "@/test/collapsibleCard";
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
    /** Whether the card can be expanded to show the breakdowns. */
    expectedGroups: boolean;
    /** Converted totals keeping their breakdown in a popup once expanded: headline, subtotals and year. */
    expectedPopups: number;
  }[] = [
    {
      name: "an empty month shows zero and hides the breakdowns",
      occurrences: [],
      yearTotal: {},
      expectedHeadline: ["NT$ 0"],
      expectedYear: "NT$ 0",
      expectedTexts: ["共 0 次扣款，來自 0 個項目", "2026 年度總計"],
      expectedGroups: false,
      expectedPopups: 0,
    },
    {
      name: "without rates totals per currency, counts, breakdowns and the year total",
      occurrences: mixedMonth,
      yearTotal: { TWD: 936000, USD: 18588 },
      expectedHeadline: ["NT$ 780", "US$ 15.49"],
      expectedYear: "NT$ 9,360US$ 185.88",
      expectedTexts: ["共 3 次扣款，來自 2 個項目"],
      expectedGroups: true,
      expectedPopups: 0,
    },
    {
      // 15.49 × 32 = 495.68 → 496; 780 + 496 = 1,276.
      // Both subscriptions share the fixture's category and payment method, so each breakdown has one mixed group.
      name: "with rates shows the totals in TWD, keeping what they were converted from in popups",
      occurrences: mixedMonth,
      yearTotal: { TWD: 936000, USD: 18588 },
      yearTwdCents: 1530800,
      rates: [{ date: "2026-01-01", rate: 32 }],
      expectedHeadline: ["NT$ 1,276"],
      expectedYear: "NT$ 15,308",
      expectedTexts: ["共 3 次扣款，來自 2 個項目"],
      expectedGroups: true,
      expectedPopups: 4,
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
      expect(screen.getByText("2026 年度總計").nextElementSibling?.textContent).toBe(tt.expectedYear);
      for (const text of tt.expectedTexts) expect(screen.getByText(text)).toBeVisible();
      const breakdowns = ["依類別", "依付款方式", "信用卡"];
      for (const name of breakdowns) expect(screen.queryByRole("heading", { name })).not.toBeInTheDocument();

      // The count line, not the title, toggles the breakdowns.
      expect(screen.queryByRole("button", { name: "本月總結" })).not.toBeInTheDocument();
      if (tt.expectedGroups) {
        expandCard(tt.expectedTexts[0]);
        for (const name of breakdowns) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole("button", { name: tt.expectedTexts[0] })).not.toBeInTheDocument();
      }
      expect(screen.queryAllByRole("button", { name: /查看換算前金額$/ })).toHaveLength(tt.expectedPopups);
    });
  }
});
