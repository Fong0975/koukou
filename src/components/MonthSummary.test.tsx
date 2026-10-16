import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import type { CurrencyTotals } from "@/lib/billingSummary";
import { makeSubscription } from "@/test/fixtures";
import { MonthSummary } from "./MonthSummary";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49" });

describe("MonthSummary", () => {
  const tests: {
    name: string;
    occurrences: Occurrence[];
    yearTotal: CurrencyTotals;
    expectedHeadline: string[];
    expectedTexts: string[];
    expectedGroups: boolean;
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
        { day: 1, subscription: netflix, scheduleId: 10 },
        { day: 1, subscription: spotify, scheduleId: 20 },
        { day: 15, subscription: netflix, scheduleId: 11 },
      ],
      yearTotal: { TWD: 936000, USD: 18588 },
      expectedHeadline: ["NT$ 780", "US$ 15.49"],
      expectedTexts: ["共 3 次扣款，來自 2 個項目", "NT$ 9,360", "US$ 185.88"],
      expectedGroups: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<MonthSummary occurrences={tt.occurrences} year={2026} yearTotal={tt.yearTotal} />);

      expect(screen.getByRole("heading", { name: "本月總結" })).toBeInTheDocument();
      const headline = screen.getByText("本月總計").nextElementSibling;
      expect([...(headline?.children ?? [])].map((line) => line.textContent)).toEqual(tt.expectedHeadline);
      for (const text of tt.expectedTexts) expect(screen.getByText(text)).toBeInTheDocument();
      for (const title of ["依類別", "依付款方式"]) {
        const list = screen.queryByRole("list", { name: title });
        if (tt.expectedGroups) expect(list).toBeInTheDocument();
        else expect(list).not.toBeInTheDocument();
      }
    });
  }
});
