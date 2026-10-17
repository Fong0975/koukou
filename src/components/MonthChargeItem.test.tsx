import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import { chargesBySubscription } from "@/lib/billingSummary";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto } from "@/types/dto";
import { MonthChargeItem } from "./MonthChargeItem";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49" });

describe("MonthChargeItem", () => {
  const tests: { name: string; occurrences: Occurrence[]; rates?: ExchangeRateDto[]; expected: string }[] = [
    {
      name: "a single charge shows its amount",
      occurrences: [makeOccurrence(1, netflix)],
      expected: "Netflix副標NT$ 390",
    },
    {
      name: "repeated charges show the unit price",
      occurrences: [makeOccurrence(1, netflix, { scheduleId: 10 }), makeOccurrence(15, netflix, { scheduleId: 11 })],
      expected: "Netflix副標NT$ 780NT$ 390 × 2",
    },
    {
      name: "an amount change mid-month shows the charge count instead of a unit price",
      occurrences: [
        makeOccurrence(1, netflix, { scheduleId: 10, amount: "330.00" }),
        makeOccurrence(15, netflix, { scheduleId: 11 }),
      ],
      expected: "Netflix副標NT$ 720共 2 次",
    },
    {
      // 15.49 × 31.5 = 487.94 → 488 and 15.49 × 32 = 495.68 → 496, each with its own day's rate.
      name: "a foreign charge also shows its approximate TWD amount",
      occurrences: [makeOccurrence(3, spotify, { scheduleId: 20 }), makeOccurrence(20, spotify, { scheduleId: 21 })],
      rates: [
        { date: "2026-01-01", rate: 31.5 },
        { date: "2026-01-15", rate: 32 },
      ],
      expected: "Spotify副標US$ 30.98≈ NT$ 984US$ 15.49 × 2",
    },
    {
      name: "a foreign charge without rates shows no TWD amount",
      occurrences: [makeOccurrence(3, spotify)],
      expected: "Spotify副標US$ 15.49",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const [charge] = chargesBySubscription(tt.occurrences);
      render(
        <ul>
          <MonthChargeItem charge={charge} subtitle="副標" rates={tt.rates ?? null} />
        </ul>,
      );

      expect(screen.getByRole("listitem").textContent).toBe(tt.expected);
    });
  }
});
