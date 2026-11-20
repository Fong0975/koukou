// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto } from "@/types/dto";
import type { Reserve } from "./amortization";
import { reserveTotalText } from "./reserveTotal";

const domain = makeSubscription({ id: 5, name: "網域", currency: "TWD" });
const cloud = makeSubscription({ id: 6, name: "雲端空間", currency: "USD" });

const reserve = (subscription: Reserve["subscription"], reserveCents: number): Reserve => ({
  key: `${subscription.id}`,
  subscription,
  chargeDate: { year: 2026, month: 10, day: 11 },
  installment: 3,
  reserveCents,
  averageCents: reserveCents,
});

const rates: ExchangeRateDto[] = [{ date: "2026-01-01", rate: 31.5 }];

describe("reserveTotalText", () => {
  const tests = [
    { name: "null without reserves", reserves: [], rates, expected: null },
    {
      name: "TWD only without rates",
      reserves: [reserve(domain, 8400), reserve(domain, 10000)],
      rates: null,
      expected: "NT$ 184",
    },
    {
      name: "per currency without rates",
      reserves: [reserve(domain, 8400), reserve(cloud, 900)],
      rates: null,
      expected: "NT$ 84 + US$ 9.00",
    },
    {
      // US$ 9 × 31.5 = 283.5 → NT$ 284, so the total is 84 + 284.
      name: "converted to TWD with rates",
      reserves: [reserve(domain, 8400), reserve(cloud, 900)],
      rates,
      expected: "NT$ 368",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(reserveTotalText(tt.reserves, tt.rates)).toBe(tt.expected);
    });
  }
});
