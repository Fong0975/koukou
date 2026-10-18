import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import { movePointer } from "@/test/pointer";
import { DayChargeCount, type PopupAlign } from "./DayChargeCount";

const occurrences = [
  makeOccurrence(15, makeSubscription({ id: 1, name: "Netflix", category: makeCategory({ icon: "🎬" }) })),
  makeOccurrence(15, makeSubscription({ id: 2, name: "記帳 App", category: makeCategory({ icon: null }) })),
];

const trigger = () => screen.getByRole("button", { name: "15 日扣款項目（2 筆）" });

describe("DayChargeCount", () => {
  const tests: {
    name: string;
    align: PopupAlign;
    open?: () => void;
    expectedNames: string[] | null;
    expectedAlign?: string;
  }[] = [
    { name: "shows only the count until opened", align: "start", expectedNames: null },
    {
      name: "a tap pops up the charges' names, lined up with the start edge",
      align: "start",
      open: () => fireEvent.click(trigger()),
      expectedNames: ["🎬 Netflix", "記帳 App"],
      expectedAlign: "left-0",
    },
    {
      name: "hovering with a mouse pops them up, lined up with the end edge",
      align: "end",
      open: () => movePointer(trigger(), "enter", "mouse"),
      expectedNames: ["🎬 Netflix", "記帳 App"],
      expectedAlign: "right-0",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<DayChargeCount day={15} occurrences={occurrences} align={tt.align} />);

      tt.open?.();

      expect(trigger()).toHaveTextContent("2");
      expect(trigger()).toHaveAttribute("aria-expanded", String(tt.expectedNames !== null));
      const popup = screen.queryByRole("list", { name: "15 日扣款項目" });
      if (tt.expectedNames === null) {
        expect(popup).not.toBeInTheDocument();
        return;
      }
      expect(popup).toHaveAttribute("id", trigger().getAttribute("aria-controls"));
      expect(popup).toHaveClass(tt.expectedAlign ?? "");
      expect(
        within(popup as HTMLElement)
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(tt.expectedNames);
    });
  }
});
