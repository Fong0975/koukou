import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ContractExpiry } from "@/lib/contractExpiries";
import { expandCard } from "@/test/collapsibleCard";
import { makeSubscription } from "@/test/fixtures";
import { MonthExpiryList } from "./MonthExpiryList";

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
    /** The footer's text, or null without a footer. */
    expectedFooter: string | null;
  }[] = [
    { name: "says so when nothing ends this month", expiries: [], expectedRows: null, expectedFooter: null },
    {
      name: "lists each contract with its name and end date, and counts them",
      expiries: [
        expiry(5, { id: 1, name: "健身房", amount: "1200.00" }),
        expiry(18, { id: 2, name: "中華電信", amount: "599.00" }),
        expiry(31, { id: 3, name: "雲端空間", currency: "USD", amount: "12.00" }),
      ],
      expectedRows: ["健身房10/5（一）", "中華電信10/18（日）", "雲端空間10/31（六）"],
      expectedFooter: "到期數量3 項",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(<MonthExpiryList expiries={tt.expiries} />);

      const region = screen.getByRole("region", { name: "本月到期" });
      expect(container.querySelector("footer")?.textContent ?? null).toBe(tt.expectedFooter);
      if (tt.expectedRows === null) {
        expect(within(region).queryByRole("list", { name: "到期項目" })).not.toBeInTheDocument();
        expect(screen.getByText("這個月沒有到期的合約。")).toBeVisible();
        return;
      }
      expandCard("本月到期");
      expect(
        within(within(region).getByRole("list", { name: "到期項目" }))
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(tt.expectedRows);
    });
  }
});
