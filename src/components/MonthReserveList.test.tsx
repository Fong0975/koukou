import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Reserve } from "@/lib/amortization";
import { expandCard } from "@/test/collapsibleCard";
import { makeSubscription } from "@/test/fixtures";
import { reserveDetailText } from "@/test/reserveDetail";
import type { ExchangeRateDto } from "@/types/dto";
import { MonthReserveList } from "./MonthReserveList";

const domain = makeSubscription({ id: 5, name: "網域", currency: "TWD" });
const cloud = makeSubscription({ id: 6, name: "雲端空間", currency: "USD" });

const reserve = (overrides: Partial<Reserve> & Pick<Reserve, "subscription">): Reserve => ({
  key: `${overrides.subscription.id}`,
  chargeDate: { year: 2026, month: 10, day: 11 },
  installment: 3,
  reserveCents: 8400,
  averageCents: 100000 / 12,
  ...overrides,
});

const twdReserves = [
  reserve({ subscription: domain }),
  reserve({ key: "5-b", subscription: domain, reserveCents: 10000, averageCents: 10000 }),
];
const mixedReserves = [
  ...twdReserves,
  reserve({
    subscription: cloud,
    chargeDate: { year: 2027, month: 3, day: 1 },
    installment: 12,
    reserveCents: 900,
    averageCents: 9999 / 12,
  }),
];
const rates: ExchangeRateDto[] = [{ date: "2026-01-01", rate: 31.5 }];

describe("MonthReserveList", () => {
  const tests: {
    name: string;
    reserves: Reserve[];
    rates?: ExchangeRateDto[];
    expectedRows: string[] | null;
    expectedSubtotal?: string;
    expectedPopup?: boolean;
  }[] = [
    { name: "renders nothing without reserves", reserves: [], expectedRows: null },
    {
      name: "without rates the subtotal stays per currency",
      reserves: mixedReserves,
      expectedRows: [
        `網域${reserveDetailText(2026, "3/12", "NT$ 83.3")}NT$ 84`,
        `網域${reserveDetailText(2026, "3/12", "NT$ 100")}NT$ 100`,
        `雲端空間${reserveDetailText(2027, "12/12", "US$ 8.3")}US$ 9`,
      ],
      expectedSubtotal: "NT$ 184US$ 9.00",
      expectedPopup: false,
    },
    {
      // US$ 9 × 31.5 = 283.5 → NT$ 284, so the subtotal is 84 + 100 + 284.
      name: "with rates foreign reserves show their TWD and the subtotal is in TWD behind an info icon",
      reserves: mixedReserves,
      rates,
      expectedRows: [
        `網域${reserveDetailText(2026, "3/12", "NT$ 83.3")}NT$ 84`,
        `網域${reserveDetailText(2026, "3/12", "NT$ 100")}NT$ 100`,
        `雲端空間${reserveDetailText(2027, "12/12", "US$ 8.3")}US$ 9≈ NT$ 284`,
      ],
      expectedSubtotal: "NT$ 468",
      expectedPopup: true,
    },
    {
      name: "with rates a TWD-only subtotal needs no breakdown",
      reserves: twdReserves,
      rates,
      expectedRows: [
        `網域${reserveDetailText(2026, "3/12", "NT$ 83.3")}NT$ 84`,
        `網域${reserveDetailText(2026, "3/12", "NT$ 100")}NT$ 100`,
      ],
      expectedSubtotal: "NT$ 184",
      expectedPopup: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<MonthReserveList reserves={tt.reserves} rates={tt.rates ?? null} />);

      if (tt.expectedRows === null) {
        expect(screen.queryByRole("heading", { name: "本月預扣" })).not.toBeInTheDocument();
        return;
      }
      expect(screen.getByRole("region", { name: "本月預扣" })).toBeInTheDocument();
      expandCard("本月預扣");
      const list = screen.getByRole("list", { name: "本月預扣" });
      expect(
        within(list)
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(tt.expectedRows);
      expect(screen.getByText("預留小計").nextElementSibling?.textContent).toBe(tt.expectedSubtotal);
      expect(screen.queryAllByRole("button", { name: `${tt.expectedSubtotal}，查看換算前金額` })).toHaveLength(
        tt.expectedPopup ? 1 : 0,
      );
    });
  }
});
