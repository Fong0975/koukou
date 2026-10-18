import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import type { ContractExpiry } from "@/lib/contractExpiries";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import { movePointer } from "@/test/pointer";
import { DayChargeCount } from "./DayChargeCount";

const occurrences = [
  makeOccurrence(15, makeSubscription({ id: 1, name: "Netflix", category: makeCategory({ icon: "🎬" }) })),
  makeOccurrence(15, makeSubscription({ id: 2, name: "記帳 App", category: makeCategory({ icon: null }) })),
];
const phone = makeSubscription({ id: 3, name: "中華電信", category: makeCategory({ icon: "📱" }) });
const expiries: ContractExpiry[] = [{ day: 15, date: "2026-01-15", subscription: phone }];

const names = (label: string) => {
  const list = screen.queryByRole("list", { name: label });
  return list
    ? within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent)
    : null;
};

describe("DayChargeCount", () => {
  const tests: {
    name: string;
    occurrences: Occurrence[];
    expiries: ContractExpiry[];
    open?: (trigger: HTMLElement) => void;
    expectedLabel: string;
    expectedTrigger: string;
    expectedCharges: string[] | null;
    expectedExpiries: string[] | null;
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
      expectedCharges: ["🎬 Netflix", "記帳 App"],
      expectedExpiries: null,
    },
    {
      name: "hovering with a mouse pops them up",
      occurrences,
      expiries: [],
      open: (trigger) => movePointer(trigger, "enter", "mouse"),
      expectedLabel: "15 日扣款項目（2 筆）",
      expectedTrigger: "2",
      expectedCharges: ["🎬 Netflix", "記帳 App"],
      expectedExpiries: null,
    },
    {
      name: "counts charges and expiries separately and lists both",
      occurrences,
      expiries,
      open: (trigger) => fireEvent.click(trigger),
      expectedLabel: "15 日扣款項目（2 筆）、合約到期（1 筆）",
      expectedTrigger: "21",
      expectedCharges: ["🎬 Netflix", "記帳 App"],
      expectedExpiries: ["📱 中華電信"],
    },
    {
      name: "a day with only an expiry",
      occurrences: [],
      expiries,
      open: (trigger) => fireEvent.click(trigger),
      expectedLabel: "15 日合約到期（1 筆）",
      expectedTrigger: "1",
      expectedCharges: null,
      expectedExpiries: ["📱 中華電信"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<DayChargeCount day={15} occurrences={tt.occurrences} expiries={tt.expiries} align="start" />);
      const trigger = screen.getByRole("button", { name: tt.expectedLabel });

      tt.open?.(trigger);

      expect(trigger).toHaveTextContent(tt.expectedTrigger);
      expect(names("15 日扣款項目")).toEqual(tt.expectedCharges);
      expect(names("15 日合約到期")).toEqual(tt.expectedExpiries);
    });
  }
});
