import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Reserve } from "@/lib/billing/amortization";
import { makeSubscription } from "@/test/fixtures";
import { reserveDetailText } from "@/test/reserveDetail";
import type { ExchangeRateDto } from "@/types/dto";
import { MonthReserveItem } from "./MonthReserveItem";

const domain = makeSubscription({ id: 5, name: "網域", currency: "TWD" });
const cloud = makeSubscription({ id: 6, name: "雲端空間", currency: "USD" });

const reserve = (overrides: Partial<Reserve> & Pick<Reserve, "subscription">): Reserve => ({
  key: `${overrides.subscription.id}`,
  chargeDate: { year: 2027, month: 3, day: 1 },
  installment: 3,
  reserveCents: 8400,
  averageCents: 100000 / 12,
  ...overrides,
});

const usdReserve = reserve({ subscription: cloud, reserveCents: 2100, averageCents: 24999 / 12 });

describe("MonthReserveItem", () => {
  const tests: { name: string; reserve: Reserve; rates?: ExchangeRateDto[]; expected: string }[] = [
    {
      name: "a TWD reserve shows its term, installment and average under the name",
      reserve: reserve({ subscription: domain }),
      expected: `網域${reserveDetailText(2027, "3/12", "NT$ 83.3")}NT$ 84`,
    },
    {
      name: "a whole average reads the same as the amount",
      reserve: reserve({ subscription: domain, installment: 12, reserveCents: 10000, averageCents: 10000 }),
      rates: [{ date: "2026-01-01", rate: 31.5 }],
      expected: `網域${reserveDetailText(2027, "12/12", "NT$ 100")}NT$ 100`,
    },
    {
      // US$ 21 × 31.32 = 657.72 → NT$ 658, using the latest rate before the 2027-03-01 charge.
      name: "a foreign reserve also shows its approximate TWD amount",
      reserve: usdReserve,
      rates: [
        { date: "2026-01-01", rate: 31.5 },
        { date: "2026-11-01", rate: 31.32 },
      ],
      expected: `雲端空間${reserveDetailText(2027, "3/12", "US$ 20.8")}US$ 21≈ NT$ 658`,
    },
    {
      name: "a foreign reserve without rates shows no TWD amount",
      reserve: usdReserve,
      expected: `雲端空間${reserveDetailText(2027, "3/12", "US$ 20.8")}US$ 21`,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <ul>
          <MonthReserveItem reserve={tt.reserve} rates={tt.rates ?? null} />
        </ul>,
      );

      expect(screen.getByRole("listitem").textContent).toBe(tt.expected);
    });
  }
});
