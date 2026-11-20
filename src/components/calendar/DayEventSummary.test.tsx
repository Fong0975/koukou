import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billing/billingOccurrences";
import type { ContractExpiry } from "@/lib/billing/contractExpiries";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import { movePointer } from "@/test/pointer";
import { DayEventSummary } from "./DayEventSummary";

const occurrences = [
  makeOccurrence(15, makeSubscription({ id: 1, name: "Netflix", category: makeCategory({ icon: "🎬" }) })),
  makeOccurrence(
    15,
    makeSubscription({ id: 2, name: "記帳 App", currency: "USD", category: makeCategory({ icon: null }) }),
    { amount: "4.99" },
  ),
];
const phone = makeSubscription({ id: 3, name: "中華電信", category: makeCategory({ icon: "📱" }) });
const expiries: ContractExpiry[] = [{ day: 15, date: "2026-01-15", subscription: phone }];

/** The popup section's heading followed by its names, or null when the section is not shown. */
const section = (label: string) => {
  const list = screen.queryByRole("list", { name: label });
  return list
    ? [
        list.previousElementSibling?.textContent,
        ...within(list)
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ]
    : null;
};

describe("DayEventSummary", () => {
  const tests: {
    name: string;
    occurrences: Occurrence[];
    expiries: ContractExpiry[];
    reserveTotal?: string;
    open?: (trigger: HTMLElement) => void;
    expectedLabel: string;
    expectedTrigger: string;
    /** The charges section's heading and names, or null when not shown. */
    expectedCharges: string[] | null;
    /** The expiries section's heading and names, or null when not shown. */
    expectedExpiries: string[] | null;
    /** The reserve row's text, or omitted when not shown. */
    expectedReserve?: string;
  }[] = [
    {
      name: "shows only the count until opened",
      occurrences,
      expiries: [],
      expectedLabel: "15 日扣款項目（2 筆）",
      expectedTrigger: "2",
      expectedCharges: null,
      expectedExpiries: null,
    },
    {
      name: "a tap pops up the charges' names",
      occurrences,
      expiries: [],
      open: (trigger) => fireEvent.click(trigger),
      expectedLabel: "15 日扣款項目（2 筆）",
      expectedTrigger: "2",
      expectedCharges: ["扣款項目", "🎬 NetflixNT$ 390", "記帳 AppUS$ 4.99"],
      expectedExpiries: null,
    },
    {
      name: "hovering with a mouse pops them up",
      occurrences,
      expiries: [],
      open: (trigger) => movePointer(trigger, "enter", "mouse"),
      expectedLabel: "15 日扣款項目（2 筆）",
      expectedTrigger: "2",
      expectedCharges: ["扣款項目", "🎬 NetflixNT$ 390", "記帳 AppUS$ 4.99"],
      expectedExpiries: null,
    },
    {
      name: "counts charges and expiries separately and lists both",
      occurrences,
      expiries,
      open: (trigger) => fireEvent.click(trigger),
      expectedLabel: "15 日扣款項目（2 筆）、到期（1 筆）",
      expectedTrigger: "21",
      expectedCharges: ["扣款項目", "🎬 NetflixNT$ 390", "記帳 AppUS$ 4.99"],
      expectedExpiries: ["到期", "📱 中華電信"],
    },
    {
      name: "a day with only an expiry",
      occurrences: [],
      expiries,
      open: (trigger) => fireEvent.click(trigger),
      expectedLabel: "15 日到期（1 筆）",
      expectedTrigger: "1",
      expectedCharges: null,
      expectedExpiries: ["到期", "📱 中華電信"],
    },
    {
      name: "counts the reserve total and lists it after the charges and expiries",
      occurrences,
      expiries,
      reserveTotal: "NT$ 1,500",
      open: (trigger) => fireEvent.click(trigger),
      expectedLabel: "15 日扣款項目（2 筆）、到期（1 筆）、預扣",
      expectedTrigger: "211",
      expectedCharges: ["扣款項目", "🎬 NetflixNT$ 390", "記帳 AppUS$ 4.99"],
      expectedExpiries: ["到期", "📱 中華電信"],
      expectedReserve: "🗓️ 本月預扣合計NT$ 1,500",
    },
    {
      name: "a day with only the reserve total",
      occurrences: [],
      expiries: [],
      reserveTotal: "NT$ 1,500",
      open: (trigger) => fireEvent.click(trigger),
      expectedLabel: "15 日預扣",
      expectedTrigger: "1",
      expectedCharges: null,
      expectedExpiries: null,
      expectedReserve: "🗓️ 本月預扣合計NT$ 1,500",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(
        <DayEventSummary
          day={15}
          occurrences={tt.occurrences}
          expiries={tt.expiries}
          reserveTotal={tt.reserveTotal ?? null}
          align="start"
        />,
      );
      const trigger = screen.getByRole("button", { name: tt.expectedLabel });

      tt.open?.(trigger);

      expect(trigger).toHaveTextContent(tt.expectedTrigger);
      expect(section("15 日扣款項目")).toEqual(tt.expectedCharges);
      expect(section("15 日到期")).toEqual(tt.expectedExpiries);
      expect(screen.queryByText("本月預扣合計")?.closest("div")?.textContent).toBe(tt.expectedReserve);
    });
  }
});
