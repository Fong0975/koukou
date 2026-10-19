import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { YearHighlights } from "@/lib/yearReport";
import { ReportHighlights } from "./ReportHighlights";

/** The tiles as label → value pairs. */
const tiles = () =>
  Object.fromEntries(
    screen.getAllByRole("term").map((term) => [term.textContent, term.nextElementSibling?.textContent]),
  );

describe("ReportHighlights", () => {
  const tests: { name: string; highlights: YearHighlights; expected: Record<string, string> }[] = [
    {
      name: "shows the year's figures in TWD",
      highlights: {
        totals: { TWD: 228000 },
        twdCents: 228000,
        monthlyAverageTwdCents: 19000,
        chargeCount: 4,
        subscriptionCount: 3,
        highest: { month: 5, totals: { TWD: 100000 }, twdCents: 100000 },
        lowest: { month: 1, totals: { TWD: 39000 }, twdCents: 39000 },
      },
      expected: {
        年度總計: "NT$ 2,280",
        每月平均: "NT$ 190",
        扣款次數: "4 次",
        扣款項目: "3 個",
        最高月份: "5 月・NT$ 1,000",
        最低月份: "1 月・NT$ 390",
      },
    },
    {
      name: "falls back to per-currency totals and dashes before the rates load",
      highlights: {
        totals: { TWD: 39000, USD: 1549 },
        twdCents: null,
        monthlyAverageTwdCents: null,
        chargeCount: 2,
        subscriptionCount: 2,
        highest: null,
        lowest: null,
      },
      expected: {
        年度總計: "NT$ 390US$ 15.49",
        每月平均: "—",
        扣款次數: "2 次",
        扣款項目: "2 個",
        最高月份: "—",
        最低月份: "—",
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<ReportHighlights highlights={tt.highlights} />);

      expect(tiles()).toEqual(tt.expected);
    });
  }
});
