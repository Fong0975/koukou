import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto } from "@/types/dto";
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
  const tests: {
    name: string;
    occurrences: Occurrence[];
    rates?: ExchangeRateDto[];
    /** Name of the sort option to pick before checking the rows. */
    order?: string;
    expectedRows: string[] | null;
  }[] = [
    { name: "a month without charges says so", occurrences: [], expectedRows: null },
    {
      name: "one row per subscription with days, unit price and subtotal",
      occurrences: [
        makeOccurrence(1, netflix, { scheduleId: 10 }),
        makeOccurrence(3, spotify, { scheduleId: 20 }),
        makeOccurrence(15, netflix, { scheduleId: 11 }),
      ],
      expectedRows: ["Netflix🎬 影音串流・1、15 日NT$ 780NT$ 390 × 2", "Spotify音樂・3 日US$ 15.49"],
    },
    {
      name: "an amount change mid-month shows the charge count instead of a unit price",
      occurrences: [
        makeOccurrence(1, netflix, { scheduleId: 10, amount: "330.00" }),
        makeOccurrence(15, netflix, { scheduleId: 11 }),
      ],
      expectedRows: ["Netflix🎬 影音串流・1、15 日NT$ 720共 2 次"],
    },
    {
      // 15.49 × 31.5 = 487.94 → 488 and 15.49 × 32 = 495.68 → 496, each with its own day's rate.
      name: "foreign rows also show their approximate TWD amount",
      occurrences: [
        makeOccurrence(1, netflix, { scheduleId: 10 }),
        makeOccurrence(3, spotify, { scheduleId: 20 }),
        makeOccurrence(20, spotify, { scheduleId: 21 }),
      ],
      rates: [
        { date: "2026-01-01", rate: 31.5 },
        { date: "2026-01-15", rate: 32 },
      ],
      expectedRows: ["Netflix🎬 影音串流・1 日NT$ 390", "Spotify音樂・3、20 日US$ 30.98≈ NT$ 984US$ 15.49 × 2"],
    },
    {
      name: "sorts by date by default",
      occurrences: [makeOccurrence(1, netflix, { scheduleId: 10 }), makeOccurrence(3, spotify, { scheduleId: 20 })],
      expectedRows: ["Netflix🎬 影音串流・1 日NT$ 390", "Spotify音樂・3 日US$ 15.49"],
    },
    {
      // Both categories share sortOrder 20, so 音樂 (id 1) goes before 影音串流 (id 2).
      name: "picking category orders rows by category",
      occurrences: [makeOccurrence(1, netflix, { scheduleId: 10 }), makeOccurrence(3, spotify, { scheduleId: 20 })],
      order: "分類",
      expectedRows: ["Spotify音樂・3 日US$ 15.49", "Netflix🎬 影音串流・1 日NT$ 390"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<MonthChargeList occurrences={tt.occurrences} rates={tt.rates ?? null} />);

      expect(screen.getByRole("heading", { name: "本月扣款清單" })).toBeInTheDocument();
      if (tt.order) fireEvent.click(screen.getByRole("radio", { name: tt.order }));
      expect(screen.getByRole("radio", { checked: true })).toHaveTextContent(tt.order ?? "日期");
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
