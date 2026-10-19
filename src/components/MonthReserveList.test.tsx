import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Reserve } from "@/lib/amortization";
import { footerAmounts } from "@/test/cardFooter";
import { expandCard } from "@/test/collapsibleCard";
import { makeSubscription } from "@/test/fixtures";
import { MonthReserveList } from "./MonthReserveList";

const domain = makeSubscription({ id: 5, name: "網域", currency: "TWD" });
const cloud = makeSubscription({ id: 6, name: "雲端空間", currency: "USD" });

const reserve = (overrides: Partial<Reserve> & Pick<Reserve, "subscription">): Reserve => ({
  key: `${overrides.subscription.id}`,
  chargeDate: { year: 2026, month: 10, day: 11 },
  reserveCents: 8400,
  averageCents: 100000 / 12,
  ...overrides,
});

describe("MonthReserveList", () => {
  const tests: { name: string; reserves: Reserve[]; expectedRows: string[] | null; expectedSubtotal?: string[] }[] = [
    { name: "renders nothing without reserves", reserves: [], expectedRows: null },
    {
      name: "lists each reserve with its term and the subtotal per currency",
      reserves: [
        reserve({ subscription: domain }),
        reserve({ key: "5-b", subscription: domain, reserveCents: 10000, averageCents: 10000 }),
        reserve({
          subscription: cloud,
          chargeDate: { year: 2027, month: 3, day: 1 },
          reserveCents: 900,
          averageCents: 9999 / 12,
        }),
      ],
      expectedRows: [
        "網域2026 年期（10/11 扣款）NT$ 84(NT$ 83.3)",
        "網域2026 年期（10/11 扣款）NT$ 100",
        "雲端空間2027 年期（3/1 扣款）US$ 9(US$ 8.3)",
      ],
      expectedSubtotal: ["NT$ 184", "US$ 9.00"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const { container } = render(<MonthReserveList reserves={tt.reserves} />);

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
      expect(footerAmounts(container, "預留小計")).toEqual(tt.expectedSubtotal);
    });
  }
});
