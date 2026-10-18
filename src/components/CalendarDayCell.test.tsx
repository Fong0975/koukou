import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import type { ContractExpiry } from "@/lib/contractExpiries";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import { CalendarDayCell } from "./CalendarDayCell";

const charge = (id: number, name: string, icon: string | null = "🎬"): Occurrence =>
  makeOccurrence(15, makeSubscription({ id, name, category: makeCategory({ icon }) }));
const expiry = (id: number, name: string): ContractExpiry => ({
  day: 15,
  date: "2026-01-15",
  subscription: makeSubscription({ id, name, category: makeCategory({ icon: "📱" }) }),
});

describe("CalendarDayCell", () => {
  const tests: {
    name: string;
    isToday?: boolean;
    occurrences: Occurrence[];
    expiries?: ContractExpiry[];
    expectedLabel: string;
    expectedChips: string[];
    /** Class marking each chip's kind, in chip order. */
    expectedVariants?: string[];
    expectedCount: string | null;
  }[] = [
    { name: "a day without charges", occurrences: [], expectedLabel: "15 日", expectedChips: [], expectedCount: null },
    {
      name: "today is marked in the label",
      isToday: true,
      occurrences: [],
      expectedLabel: "15 日（今天）",
      expectedChips: [],
      expectedCount: null,
    },
    {
      name: "lists the charges with their category icon",
      occurrences: [charge(1, "Netflix"), charge(2, "記帳 App", null)],
      expectedLabel: "15 日：Netflix、記帳 App",
      expectedChips: ["🎬 Netflix", "記帳 App"],
      expectedCount: "2",
    },
    {
      name: "collapses charges beyond three into +N",
      isToday: true,
      occurrences: [charge(1, "A"), charge(2, "B"), charge(3, "C"), charge(4, "D"), charge(5, "E")],
      expectedLabel: "15 日（今天）：A、B、C、D、E",
      expectedChips: ["🎬 A", "🎬 B", "🎬 C", "+2"],
      expectedCount: "5",
    },
    {
      name: "lists contract expiries before the charges",
      occurrences: [charge(1, "Netflix")],
      expiries: [expiry(9, "中華電信")],
      expectedLabel: "15 日：Netflix；合約到期：中華電信",
      expectedChips: ["📱 中華電信 到期", "🎬 Netflix"],
      expectedVariants: ["cal-chip-expiry", "cal-chip-charge"],
      expectedCount: "11",
    },
    {
      name: "a day with only a contract expiry",
      occurrences: [],
      expiries: [expiry(9, "中華電信")],
      expectedLabel: "15 日：合約到期：中華電信",
      expectedChips: ["📱 中華電信 到期"],
      expectedVariants: ["cal-chip-expiry"],
      expectedCount: "1",
    },
    {
      name: "expiries count towards the three named chips",
      occurrences: [charge(1, "A"), charge(2, "B"), charge(3, "C")],
      expiries: [expiry(9, "中華電信")],
      expectedLabel: "15 日：A、B、C；合約到期：中華電信",
      expectedChips: ["📱 中華電信 到期", "🎬 A", "🎬 B", "+1"],
      expectedCount: "31",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <table>
          <tbody>
            <tr>
              <CalendarDayCell
                day={15}
                isToday={tt.isToday ?? false}
                occurrences={tt.occurrences}
                expiries={tt.expiries ?? []}
                popupAlign="start"
              />
            </tr>
          </tbody>
        </table>,
      );

      const cell = screen.getByRole("cell", { name: tt.expectedLabel });
      const chips = within(cell).queryAllByRole("listitem");
      expect(chips.map((li) => li.textContent)).toEqual(tt.expectedChips);
      if (tt.expectedVariants) {
        const variants = chips.map((li) => [...li.classList].find((name) => name.startsWith("cal-chip-")));
        expect(variants.slice(0, tt.expectedVariants.length)).toEqual(tt.expectedVariants);
      }
      const count = within(cell).queryByRole("button", { name: /^15 日/ });
      expect(count?.textContent ?? null).toBe(tt.expectedCount);
    });
  }
});
