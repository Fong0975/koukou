import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { chargeGroups, type ChargeOrder } from "@/lib/chargeGroups";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto } from "@/types/dto";
import { ChargeGroupList } from "./ChargeGroupList";

const music = makeCategory({ id: 1, name: "音樂", icon: "🎵", sortOrder: 10 });
const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49", category: music });

describe("ChargeGroupList", () => {
  const tests: {
    name: string;
    order: ChargeOrder;
    rates?: ExchangeRateDto[];
    expectedHeading: string;
    expectedSubtotal: string;
    expectedRows: string[];
  }[] = [
    {
      name: "a date group names the category on each row",
      order: "date",
      expectedHeading: "1/1（四）",
      expectedSubtotal: "NT$ 390US$ 15.49",
      expectedRows: ["Netflix🎬 影音串流NT$ 390", "Spotify🎵 音樂US$ 15.49"],
    },
    {
      // 15.49 × 32 = 495.68 → 496; 390 + 496 = 886.
      name: "with rates the subtotal is in TWD with what it was converted from",
      order: "date",
      rates: [{ date: "2026-01-01", rate: 32 }],
      expectedHeading: "1/1（四）",
      expectedSubtotal: "NT$ 886(NT$ 390, US$ 15.49)",
      expectedRows: ["Netflix🎬 影音串流NT$ 390", "Spotify🎵 音樂US$ 15.49≈ NT$ 496"],
    },
    {
      name: "a category group shows its icon and the charge days on each row",
      order: "category",
      expectedHeading: "🎵 音樂",
      expectedSubtotal: "US$ 15.49",
      expectedRows: ["Spotify1 日US$ 15.49"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const [group] = chargeGroups([makeOccurrence(1, netflix), makeOccurrence(1, spotify)], tt.order);
      render(<ChargeGroupList group={group} order={tt.order} rates={tt.rates ?? null} />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading.textContent).toBe(tt.expectedHeading);
      expect(heading.nextElementSibling?.textContent).toBe(tt.expectedSubtotal);
      const list = screen.getByRole("list", { name: group.label });
      expect(
        within(list)
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(tt.expectedRows);
    });
  }
});
