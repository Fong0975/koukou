import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PaymentTypeTotals } from "@/lib/billingSummary";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto } from "@/types/dto";
import { PaymentTypeTotalsList } from "./PaymentTypeTotalsList";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49" });
const gym = makeSubscription({ id: 3, name: "健身房", currency: "TWD", amount: "599.00" });

const sections: PaymentTypeTotals[] = [
  {
    type: "CREDIT_CARD",
    label: "信用卡",
    groups: [
      { key: 1, label: "玉山 南山聯名", icon: null, totals: { TWD: 39000 }, occurrences: [makeOccurrence(1, netflix)] },
      { key: 2, label: "國泰 CUBE", icon: null, totals: { USD: 1549 }, occurrences: [makeOccurrence(1, spotify)] },
    ],
  },
  {
    type: "OTHER",
    label: "其他",
    groups: [
      { key: 3, label: "無自動扣款", icon: null, totals: { TWD: 59900 }, occurrences: [makeOccurrence(5, gym)] },
    ],
  },
];

describe("PaymentTypeTotalsList", () => {
  const tests: {
    name: string;
    sections: PaymentTypeTotals[];
    rates: ExchangeRateDto[] | null;
    expected: Record<string, string[]>;
  }[] = [
    {
      name: "without rates lists each type's methods by name with per-currency totals",
      sections,
      rates: null,
      expected: { 信用卡: ["玉山 南山聯名NT$ 390", "國泰 CUBEUS$ 15.49"], 其他: ["無自動扣款NT$ 599"] },
    },
    {
      // 15.49 × 32 = 495.68 → 496.
      name: "with rates shows each subtotal in TWD and what it was converted from",
      sections,
      rates: [{ date: "2026-01-01", rate: 32 }],
      expected: { 信用卡: ["玉山 南山聯名NT$ 390", "國泰 CUBENT$ 496(US$ 15.49)"], 其他: ["無自動扣款NT$ 599"] },
    },
    { name: "no sections", sections: [], rates: null, expected: {} },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<PaymentTypeTotalsList title="依付款方式" sections={tt.sections} rates={tt.rates} />);

      expect(screen.getByRole("heading", { name: "依付款方式" })).toBeInTheDocument();
      expect(screen.queryAllByRole("heading", { level: 4 }).map((h) => h.textContent)).toEqual(
        Object.keys(tt.expected),
      );
      for (const [label, rows] of Object.entries(tt.expected)) {
        const list = screen.getByRole("list", { name: label });
        expect(
          within(list)
            .getAllByRole("listitem")
            .map((li) => li.textContent),
        ).toEqual(rows);
      }
    });
  }
});
