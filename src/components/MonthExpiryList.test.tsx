import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ContractExpiry } from "@/lib/contractExpiries";
import { makeSubscription } from "@/test/fixtures";
import { MonthExpiryList } from "./MonthExpiryList";

const today = { year: 2026, month: 10, day: 18 };
const expiry = (day: number, overrides: Parameters<typeof makeSubscription>[0]): ContractExpiry => ({
  day,
  date: `2026-10-${String(day).padStart(2, "0")}`,
  subscription: makeSubscription(overrides),
});

describe("MonthExpiryList", () => {
  const tests: {
    name: string;
    expiries: ContractExpiry[];
    expectedRows: string[] | null;
    /** Text of the days-left part of each row and whether it is red. */
    expectedRemaining?: [string, boolean][];
  }[] = [
    { name: "says so when nothing ends this month", expiries: [], expectedRows: null },
    {
      name: "lists each contract with its end date, days left and last amount",
      expiries: [
        expiry(5, { id: 1, name: "健身房", amount: "1200.00" }),
        expiry(18, { id: 2, name: "中華電信", amount: "599.00" }),
        expiry(31, {
          id: 3,
          name: "雲端空間",
          currency: "USD",
          amount: "12.00",
          amountPeriods: [{ id: 1, amount: "9.99", endDate: "2026-12-31" }],
        }),
      ],
      expectedRows: [
        "健身房10/5（一） · 已到期 13 天NT$ 1,200",
        "中華電信10/18（日） · 今天到期NT$ 599",
        "雲端空間10/31（六） · 剩 13 天US$ 9.99",
      ],
      expectedRemaining: [
        ["已到期 13 天", true],
        ["今天到期", true],
        ["剩 13 天", false],
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<MonthExpiryList expiries={tt.expiries} today={today} />);

      const region = screen.getByRole("region", { name: "本月到期" });
      const list = within(region).queryByRole("list", { name: "到期項目" });
      if (tt.expectedRows === null) {
        expect(list).not.toBeInTheDocument();
        expect(region).toHaveTextContent("這個月沒有到期的合約。");
        return;
      }
      expect(
        within(list as HTMLElement)
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(tt.expectedRows);
      for (const [text, red] of tt.expectedRemaining ?? []) {
        expect(within(region).getByText(text).classList.contains("text-berry")).toBe(red);
      }
    });
  }
});
