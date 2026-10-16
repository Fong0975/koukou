import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CurrencyTotals } from "@/lib/billingSummary";
import { CurrencyAmounts } from "./CurrencyAmounts";

describe("CurrencyAmounts", () => {
  const tests: { name: string; totals: CurrencyTotals; expected: string[] }[] = [
    { name: "empty totals read as zero", totals: {}, expected: ["NT$ 0"] },
    { name: "one currency", totals: { TWD: 129000 }, expected: ["NT$ 1,290"] },
    { name: "one line per currency, TWD first", totals: { USD: 4647, TWD: 39000 }, expected: ["NT$ 390", "US$ 46.47"] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(<CurrencyAmounts totals={tt.totals} />);

      const lines = [...(container.firstElementChild?.children ?? [])].map((line) => line.textContent);
      expect(lines).toEqual(tt.expected);
    });
  }
});
