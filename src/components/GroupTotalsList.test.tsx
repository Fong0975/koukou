import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GroupTotal } from "@/lib/billingSummary";
import { GroupTotalsList } from "./GroupTotalsList";

describe("GroupTotalsList", () => {
  const tests: { name: string; groups: GroupTotal[]; expected: string[] }[] = [
    {
      name: "lists each group with its icon and per-currency totals",
      groups: [
        { key: 1, label: "音樂", icon: "🎵", totals: { USD: 1549 } },
        { key: 2, label: "影音串流", icon: null, totals: { TWD: 39000, USD: 500 } },
      ],
      expected: ["🎵 音樂US$ 15.49", "影音串流NT$ 390US$ 5.00"],
    },
    { name: "an empty list", groups: [], expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<GroupTotalsList title="依類別" groups={tt.groups} />);

      expect(screen.getByRole("heading", { name: "依類別" })).toBeInTheDocument();
      const list = screen.getByRole("list", { name: "依類別" });
      expect(
        within(list)
          .queryAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(tt.expected);
    });
  }
});
