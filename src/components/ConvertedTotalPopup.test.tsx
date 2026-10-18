import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ConvertedPart } from "@/lib/format";
import { movePointer } from "@/test/pointer";
import { ConvertedTotalPopup } from "./ConvertedTotalPopup";

const trigger = () => screen.getByRole("button", { name: "NT$ 1,500，查看換算前金額" });

describe("ConvertedTotalPopup", () => {
  const usd: ConvertedPart = { amount: "US$ 31.00", twd: "NT$ 1,000" };
  const tests: { name: string; breakdown: ConvertedPart[]; open?: () => void; expectedLines: string[] | null }[] = [
    { name: "shows only the total until opened", breakdown: [usd], expectedLines: null },
    {
      name: "a tap lists the original amounts one per line, a foreign one followed by its TWD",
      breakdown: [{ amount: "NT$ 500", twd: null }, usd],
      open: () => fireEvent.click(trigger()),
      expectedLines: ["NT$ 500", "US$ 31.00 (NT$ 1,000)"],
    },
    {
      name: "hovering with a mouse lists them too",
      breakdown: [usd],
      open: () => movePointer(trigger(), "enter", "mouse"),
      expectedLines: ["US$ 31.00 (NT$ 1,000)"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<ConvertedTotalPopup total="NT$ 1,500" breakdown={tt.breakdown} align="end" />);

      tt.open?.();

      expect(trigger()).toHaveTextContent(/^NT\$ 1,500$/);
      expect(trigger().querySelector("svg")).toBeInTheDocument();
      const list = screen.queryByRole("list", { name: "換算前金額" });
      if (tt.expectedLines === null) {
        expect(list).not.toBeInTheDocument();
        return;
      }
      const items = within(list as HTMLElement).getAllByRole("listitem");
      expect(items.map((li) => li.textContent)).toEqual(tt.expectedLines);
      for (const li of items) {
        const twd = li.querySelector("span");
        if (twd) expect(twd).toHaveClass("text-ink-soft");
      }
    });
  }
});
