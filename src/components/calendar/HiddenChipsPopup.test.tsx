import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Chip } from "@/lib/date/calendarDay";
import { movePointer } from "@/test/pointer";
import { HiddenChipsPopup } from "./HiddenChipsPopup";

const chip = (
  key: string,
  variant: Chip["variant"],
  icon: string | null,
  name: string,
  amount: string | null,
): Chip => ({
  key,
  variant,
  icon,
  label: name,
  name,
  title: name,
  amount,
});

const hidden = [
  chip("reserve", "reserve", "🗓️", "本月預扣合計", "NT$ 1,500"),
  chip("1-10", "charge", "🎬", "Netflix", "NT$ 390"),
  chip("2-20", "charge", null, "記帳 App", "US$ 4.99"),
  chip("expiry-3", "expiry", "📱", "中華電信", null),
];

/** The popup's headings and, under each, its rows, in display order. */
const popupContent = () =>
  screen.queryAllByRole("list").map((list) => [
    list.previousElementSibling?.textContent,
    ...within(list)
      .getAllByRole("listitem")
      .map((li) => li.textContent),
  ]);

describe("HiddenChipsPopup", () => {
  const tests: {
    name: string;
    chips: Chip[];
    open?: (trigger: HTMLElement) => void;
    expectedLabel: string;
    expectedTrigger: string;
    expectedContent: (string | null | undefined)[][];
  }[] = [
    {
      name: "shows only the count until opened",
      chips: hidden,
      expectedLabel: "其餘 4 個項目",
      expectedTrigger: "+4",
      expectedContent: [],
    },
    {
      name: "a tap pops up the hidden items grouped by kind, most severe first",
      chips: hidden,
      open: (trigger) => fireEvent.click(trigger),
      expectedLabel: "其餘 4 個項目",
      expectedTrigger: "+4",
      expectedContent: [
        ["到期", "📱 中華電信"],
        ["扣款項目", "🎬 NetflixNT$ 390", "記帳 AppUS$ 4.99"],
        ["預扣", "🗓️ 本月預扣合計NT$ 1,500"],
      ],
    },
    {
      name: "hovering with a mouse pops them up, leaving out kinds without items",
      chips: [hidden[1]],
      open: (trigger) => movePointer(trigger, "enter", "mouse"),
      expectedLabel: "其餘 1 個項目",
      expectedTrigger: "+1",
      expectedContent: [["扣款項目", "🎬 NetflixNT$ 390"]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<HiddenChipsPopup chips={tt.chips} align="start" />);
      const trigger = screen.getByRole("button", { name: tt.expectedLabel });

      tt.open?.(trigger);

      expect(trigger).toHaveTextContent(tt.expectedTrigger);
      expect(popupContent()).toEqual(tt.expectedContent);
    });
  }
});
