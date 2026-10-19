import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RankedSubscription } from "@/lib/yearReport";
import { makeCategory, makeSubscription } from "@/test/fixtures";
import { SubscriptionRanking } from "./SubscriptionRanking";

const gym = makeSubscription({ id: 3, name: "健身房", category: makeCategory({ name: "運動", icon: null }) });
const netflix = makeSubscription({ id: 1, name: "Netflix" });

describe("SubscriptionRanking", () => {
  const tests: { name: string; ranking: RankedSubscription[]; expectedItems: string[]; expectedBars: string[] }[] = [
    {
      name: "ranks each subscription with its category, count, total and relative bar",
      ranking: [
        { subscription: gym, count: 1, totals: { TWD: 100000 }, twdCents: 100000, share: 1 },
        { subscription: netflix, count: 2, totals: { TWD: 78000 }, twdCents: 78000, share: 0.78 },
      ],
      expectedItems: ["1健身房運動・1 次NT$ 1,000", "2Netflix🎬 影音串流・2 次NT$ 780"],
      expectedBars: ["100%", "78%"],
    },
    { name: "an empty ranking", ranking: [], expectedItems: [], expectedBars: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      render(<SubscriptionRanking ranking={tt.ranking} />);

      const items = within(screen.getByRole("list", { name: "項目排行" })).queryAllByRole("listitem");
      expect(items.map((item) => item.textContent)).toEqual(tt.expectedItems);
      expect(
        items.map((item) => (item.querySelector("[aria-hidden] > div") as HTMLElement | null)?.style.width),
      ).toEqual(tt.expectedBars);
    });
  }
});
