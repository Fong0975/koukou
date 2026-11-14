import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Currency } from "@/generated/prisma/enums";
import type { ExchangeRateDto } from "@/types/dto";
import { ApproxTwdLine } from "./ApproxTwdLine";

describe("ApproxTwdLine", () => {
  const rates: ExchangeRateDto[] = [{ date: "2026-05-15", rate: 32 }];
  const tests: { name: string; currency: Currency; rates: ExchangeRateDto[] | null; expected: string }[] = [
    { name: "shows the converted amount of a foreign currency", currency: "USD", rates, expected: "≈ NT$ 320" },
    { name: "shows nothing for TWD", currency: "TWD", rates, expected: "" },
    { name: "shows nothing while the rates are unavailable", currency: "USD", rates: null, expected: "" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const toTwdCents = vi.fn(() => 32000);
      const { container } = render(<ApproxTwdLine currency={tt.currency} rates={tt.rates} toTwdCents={toTwdCents} />);

      expect(container.textContent).toBe(tt.expected);
      expect(toTwdCents).toHaveBeenCalledTimes(tt.expected ? 1 : 0);
    });
  }
});
