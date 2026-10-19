import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GroupShare } from "@/lib/yearReport";
import { DistributionChart } from "./DistributionChart";

const music: GroupShare = { key: 1, label: "音樂", icon: "🎵", totals: { TWD: 25000 }, twdCents: 25000, share: 0.25 };
const video: GroupShare = {
  key: 2,
  label: "影音串流",
  icon: null,
  totals: { TWD: 75000 },
  twdCents: 75000,
  share: 0.75,
};

/** Nine TWD 100 groups, one more than the chart has hues for. */
const nine: GroupShare[] = Array.from({ length: 9 }, (_, index) => ({
  key: index + 1,
  label: `類別 ${index + 1}`,
  icon: null,
  totals: { TWD: 10000 },
  twdCents: 10000,
  share: 1 / 9,
}));

describe("DistributionChart", () => {
  const tests: { name: string; groups: GroupShare[]; expectedItems: string[]; expectedPending: boolean }[] = [
    {
      name: "lists each group's total and share",
      groups: [music, video],
      expectedItems: ["🎵 音樂NT$ 25025%", "影音串流NT$ 75075%"],
      expectedPending: false,
    },
    {
      name: "shows per-currency totals without shares while the rates load",
      groups: [
        { ...music, totals: { USD: 1549 }, twdCents: null, share: 0 },
        { ...video, share: 0 },
      ],
      expectedItems: ["🎵 音樂US$ 15.49", "影音串流NT$ 750"],
      expectedPending: true,
    },
    {
      name: "merges groups beyond its hues into 其他",
      groups: nine,
      expectedItems: [...Array.from({ length: 7 }, (_, index) => `類別 ${index + 1}NT$ 10011%`), "其他NT$ 20022%"],
      expectedPending: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<DistributionChart title="依類別" groups={tt.groups} />);

      expect(screen.getByRole("heading", { name: "依類別" })).toBeInTheDocument();
      const legend = screen.getByRole("list", { name: "依類別" });
      expect(
        within(legend)
          .getAllByRole("listitem")
          .map((item) => item.textContent),
      ).toEqual(tt.expectedItems);
      expect(screen.queryByText(/匯率載入中/) !== null).toBe(tt.expectedPending);
    });
  }
});
