import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MonthTotal } from "@/lib/yearReport";
import { MonthlyBarChart } from "./MonthlyBarChart";

/** Twelve monthly totals, empty except for the given TWD totals. */
const months = (twdCents: Record<number, number | null>): MonthTotal[] =>
  Array.from({ length: 12 }, (_, index) => {
    const cents = twdCents[index + 1];
    return { month: index + 1, totals: cents ? { TWD: cents } : {}, twdCents: cents === undefined ? 0 : cents };
  });

describe("MonthlyBarChart", () => {
  const tests: { name: string; months: MonthTotal[]; expected: string[] | null }[] = [
    {
      name: "lists every month's TWD total for screen readers",
      months: months({ 1: 39000, 5: 99950 }),
      expected: [
        "1 月 NT$ 390",
        "2 月 NT$ 0",
        "3 月 NT$ 0",
        "4 月 NT$ 0",
        "5 月 NT$ 999.50",
        "6 月 NT$ 0",
        "7 月 NT$ 0",
        "8 月 NT$ 0",
        "9 月 NT$ 0",
        "10 月 NT$ 0",
        "11 月 NT$ 0",
        "12 月 NT$ 0",
      ],
    },
    {
      name: "waits for the rates while a month cannot be converted",
      months: months({ 1: 39000, 3: null }),
      expected: null,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<MonthlyBarChart months={tt.months} averageTwdCents={11579} />);

      if (tt.expected === null) {
        expect(screen.getByText(/匯率載入中/)).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
      } else {
        const list = screen.getByRole("list", { name: "每月扣款" });
        expect(
          within(list)
            .getAllByRole("listitem")
            .map((item) => item.textContent),
        ).toEqual(tt.expected);
      }
    });
  }
});
