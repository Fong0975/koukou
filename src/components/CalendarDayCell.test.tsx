import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import { CalendarDayCell } from "./CalendarDayCell";

const charge = (id: number, name: string, icon: string | null = "🎬"): Occurrence =>
  makeOccurrence(15, makeSubscription({ id, name, category: makeCategory({ icon }) }));

describe("CalendarDayCell", () => {
  const tests: {
    name: string;
    isToday?: boolean;
    occurrences: Occurrence[];
    expectedLabel: string;
    expectedChips: string[];
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
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <table>
          <tbody>
            <tr>
              <CalendarDayCell day={15} isToday={tt.isToday ?? false} occurrences={tt.occurrences} popupAlign="start" />
            </tr>
          </tbody>
        </table>,
      );

      const cell = screen.getByRole("cell", { name: tt.expectedLabel });
      const chips = within(cell)
        .queryAllByRole("listitem")
        .map((li) => li.textContent);
      expect(chips).toEqual(tt.expectedChips);
      const count = within(cell).queryByRole("button", { name: /^15 日扣款項目/ });
      expect(count?.textContent ?? null).toBe(tt.expectedCount);
    });
  }
});
