import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CurrencyTotals } from "@/lib/billingSummary";
import { ConvertedAmounts } from "./ConvertedAmounts";

describe("ConvertedAmounts", () => {
  const tests: {
    name: string;
    totals: CurrencyTotals;
    twdCents: number | null;
    layout?: "stacked" | "inline";
    expectedLines: string[];
    expectedDirection: string;
  }[] = [
    {
      name: "without a conversion shows one line per currency",
      totals: { USD: 3100, TWD: 50000 },
      twdCents: null,
      expectedLines: ["NT$ 500", "US$ 31.00"],
      expectedDirection: "flex-col",
    },
    {
      name: "a TWD-only total has no breakdown",
      totals: { TWD: 50000 },
      twdCents: 50000,
      expectedLines: ["NT$ 500"],
      expectedDirection: "flex-wrap",
    },
    {
      name: "inline breakdown follows the converted total",
      totals: { USD: 3100, TWD: 50000 },
      twdCents: 150000,
      expectedLines: ["NT$ 1,500", "(NT$ 500, US$ 31.00)"],
      expectedDirection: "flex-wrap",
    },
    {
      name: "stacked breakdown of a USD-only total",
      totals: { USD: 3100 },
      twdCents: 100000,
      layout: "stacked",
      expectedLines: ["NT$ 1,000", "(US$ 31.00)"],
      expectedDirection: "flex-col",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(<ConvertedAmounts totals={tt.totals} twdCents={tt.twdCents} layout={tt.layout} />);

      const wrapper = container.firstElementChild;
      expect([...(wrapper?.children ?? [])].map((line) => line.textContent)).toEqual(tt.expectedLines);
      expect(wrapper).toHaveClass(tt.expectedDirection);
    });
  }
});
