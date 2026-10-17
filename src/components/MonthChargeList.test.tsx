import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/lib/billingOccurrences";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import { MonthChargeList } from "./MonthChargeList";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({
  id: 2,
  name: "Spotify",
  currency: "USD",
  amount: "15.49",
  category: makeCategory({ id: 1, name: "音樂", icon: null, sortOrder: 10 }),
});

const occurrences = [
  makeOccurrence(1, netflix, { scheduleId: 10 }),
  makeOccurrence(3, spotify, { scheduleId: 20 }),
  makeOccurrence(15, netflix, { scheduleId: 11 }),
];

// Row and group rendering are covered by MonthChargeItem's and ChargeGroupList's tests; this checks the
// grouping picked in the header.
describe("MonthChargeList", () => {
  const tests: {
    name: string;
    occurrences: Occurrence[];
    /** Name of the grouping to pick before checking the groups. */
    order?: string;
    /** Each group's heading with the names of its rows, or null for the empty state. */
    expectedGroups: [string, string[]][] | null;
  }[] = [
    { name: "a month without charges says so", occurrences: [], expectedGroups: null },
    {
      name: "groups by date by default, only for days with charges",
      occurrences,
      expectedGroups: [
        ["1/1（四）", ["Netflix"]],
        ["1/3（六）", ["Spotify"]],
        ["1/15（四）", ["Netflix"]],
      ],
    },
    {
      // 音樂 (sortOrder 10) goes before 影音串流 (sortOrder 20).
      name: "picking category groups by category, only for categories with charges",
      occurrences,
      order: "分類",
      expectedGroups: [
        ["音樂", ["Spotify"]],
        ["🎬 影音串流", ["Netflix"]],
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<MonthChargeList occurrences={tt.occurrences} rates={null} />);

      expect(screen.getByRole("heading", { level: 2, name: "本月扣款清單" })).toBeInTheDocument();
      if (tt.order) fireEvent.click(screen.getByRole("radio", { name: tt.order }));
      expect(screen.getByRole("radio", { checked: true })).toHaveTextContent(tt.order ?? "日期");

      if (tt.expectedGroups === null) {
        expect(screen.getByText("這個月沒有扣款。")).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        return;
      }
      const groups = screen.getAllByRole("heading", { level: 3 }).map((heading) => {
        const names = within(heading.closest("section")!)
          .getAllByRole("listitem")
          .map((li) => li.querySelector("p")?.textContent ?? "");
        return [heading.textContent, names];
      });
      expect(groups).toEqual(tt.expectedGroups);
    });
  }
});
