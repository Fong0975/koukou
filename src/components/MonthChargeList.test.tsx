import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import { makeCategory, makeSubscription } from "@/test/fixtures";
import { MonthChargeList } from "./MonthChargeList";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({
  id: 2,
  name: "Spotify",
  currency: "USD",
  amount: "15.49",
  category: makeCategory({ id: 1, name: "音樂", icon: null }),
});

describe("MonthChargeList", () => {
  const tests: { name: string; occurrences: Occurrence[]; expectedRows: string[] | null }[] = [
    { name: "a month without charges says so", occurrences: [], expectedRows: null },
    {
      name: "one row per subscription with days, unit price and subtotal",
      occurrences: [
        { day: 1, subscription: netflix, scheduleId: 10 },
        { day: 3, subscription: spotify, scheduleId: 20 },
        { day: 15, subscription: netflix, scheduleId: 11 },
      ],
      expectedRows: ["Netflix🎬 影音串流・1、15 日NT$ 780NT$ 390 × 2", "Spotify音樂・3 日US$ 15.49"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<MonthChargeList occurrences={tt.occurrences} />);

      expect(screen.getByRole("heading", { name: "本月扣款清單" })).toBeInTheDocument();
      if (tt.expectedRows === null) {
        expect(screen.getByText("這個月沒有扣款。")).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
      } else {
        const list = screen.getByRole("list", { name: "本月扣款" });
        expect(
          within(list)
            .getAllByRole("listitem")
            .map((li) => li.textContent),
        ).toEqual(tt.expectedRows);
      }
    });
  }
});
