import { describe, expect, it } from "vitest";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import type { SubscriptionCharges } from "./billingSummary";
import { sortCharges, type ChargeOrder } from "./chargeOrder";

const music = makeCategory({ id: 1, name: "音樂", sortOrder: 10 });
const video = makeCategory({ id: 2, name: "影音串流", sortOrder: 20 });
const tools = makeCategory({ id: 3, name: "工具", sortOrder: 20 });

const netflix = makeSubscription({ id: 1, name: "Netflix", category: video });
const spotify = makeSubscription({ id: 2, name: "Spotify", category: music });
const disney = makeSubscription({ id: 3, name: "Disney+", category: video });
const notion = makeSubscription({ id: 4, name: "Notion", category: tools });

const charge = (subscription: SubscriptionDto, days: number[]): SubscriptionCharges => ({
  subscription,
  days,
  count: days.length,
  totalCents: 0,
  unitCents: 0,
  occurrences: days.map((day) => makeOccurrence(day, subscription)),
});

describe("sortCharges", () => {
  const tests: { name: string; order: ChargeOrder; charges: SubscriptionCharges[]; expected: string[] }[] = [
    { name: "no charges", order: "category", charges: [], expected: [] },
    {
      name: "date orders by first charge day, then name",
      order: "date",
      charges: [charge(netflix, [20]), charge(spotify, [3, 25]), charge(disney, [3])],
      expected: ["Disney+", "Spotify", "Netflix"],
    },
    {
      name: "category groups by the categories' order, ties by id, then by date within a category",
      order: "category",
      charges: [charge(notion, [1]), charge(netflix, [20]), charge(spotify, [25]), charge(disney, [3])],
      expected: ["Spotify", "Disney+", "Netflix", "Notion"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const input = [...tt.charges];
      const sorted = sortCharges(input, tt.order);

      expect(sorted.map(({ subscription }) => subscription.name)).toEqual(tt.expected);
      expect(input).toEqual(tt.charges);
    });
  }
});
