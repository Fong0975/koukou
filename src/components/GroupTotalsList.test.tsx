import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GroupTotal } from "@/lib/billingSummary";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto } from "@/types/dto";
import { GroupTotalsList } from "./GroupTotalsList";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49" });

const groups: GroupTotal[] = [
  { key: 1, label: "音樂", icon: "🎵", totals: { USD: 1549 }, occurrences: [makeOccurrence(1, spotify)] },
  {
    key: 2,
    label: "影音串流",
    icon: null,
    totals: { TWD: 39000 },
    occurrences: [makeOccurrence(1, netflix)],
  },
];

describe("GroupTotalsList", () => {
  const tests: { name: string; groups: GroupTotal[]; rates: ExchangeRateDto[] | null; expected: string[] }[] = [
    {
      name: "without rates lists each group with its icon and per-currency totals",
      groups,
      rates: null,
      expected: ["🎵 音樂US$ 15.49", "影音串流NT$ 390"],
    },
    {
      // 15.49 × 32 = 495.68 → 496.
      name: "with rates shows each subtotal in TWD, keeping what it was converted from in a popup",
      groups,
      rates: [{ date: "2026-01-01", rate: 32 }],
      expected: ["🎵 音樂NT$ 496", "影音串流NT$ 390"],
    },
    { name: "an empty list", groups: [], rates: null, expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<GroupTotalsList title="依類別" groups={tt.groups} rates={tt.rates} />);

      expect(screen.getByRole("heading", { name: "依類別" })).toBeInTheDocument();
      const list = screen.getByRole("list", { name: "依類別" });
      expect(
        within(list)
          .queryAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(tt.expected);
    });
  }
});
