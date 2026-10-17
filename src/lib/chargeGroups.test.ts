import { describe, expect, it } from "vitest";
import { makeCategory, makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { Occurrence } from "./billingOccurrences";
import { chargeGroups, type ChargeOrder } from "./chargeGroups";

const music = makeCategory({ id: 1, name: "音樂", icon: "🎵", sortOrder: 10 });
const video = makeCategory({ id: 2, name: "影音串流", icon: "🎬", sortOrder: 20 });

const netflix = makeSubscription({ id: 1, name: "Netflix", amount: "390.00", category: video });
const disney = makeSubscription({ id: 3, name: "Disney+", amount: "270.00", category: video });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49", category: music });

const occurrences: Occurrence[] = [
  makeOccurrence(1, netflix, { scheduleId: 10 }),
  makeOccurrence(1, disney),
  makeOccurrence(3, spotify),
  makeOccurrence(15, netflix, { scheduleId: 11 }),
];

describe("chargeGroups", () => {
  const tests: {
    name: string;
    order: ChargeOrder;
    occurrences: Occurrence[];
    expected: { key: number; label: string; icon: string | null; totals: object; charges: [string, number[]][] }[];
  }[] = [
    { name: "no charges gives no groups", order: "date", occurrences: [], expected: [] },
    {
      name: "date makes one group per charge day, repeating a subscription on each of its days",
      order: "date",
      occurrences,
      expected: [
        {
          key: 1,
          label: "1/1（四）",
          icon: null,
          totals: { TWD: 66000 },
          charges: [
            ["Disney+", [1]],
            ["Netflix", [1]],
          ],
        },
        { key: 3, label: "1/3（六）", icon: null, totals: { USD: 1549 }, charges: [["Spotify", [3]]] },
        { key: 15, label: "1/15（四）", icon: null, totals: { TWD: 39000 }, charges: [["Netflix", [15]]] },
      ],
    },
    {
      name: "category makes one group per category in configured order, rows by first charge day",
      order: "category",
      occurrences,
      expected: [
        { key: 1, label: "音樂", icon: "🎵", totals: { USD: 1549 }, charges: [["Spotify", [3]]] },
        {
          key: 2,
          label: "影音串流",
          icon: "🎬",
          totals: { TWD: 105000 },
          charges: [
            ["Disney+", [1]],
            ["Netflix", [1, 15]],
          ],
        },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = chargeGroups(tt.occurrences, tt.order).map(({ key, label, icon, totals, charges }) => ({
        key,
        label,
        icon,
        totals,
        charges: charges.map(({ subscription, days }) => [subscription.name, days]),
      }));

      expect(result).toEqual(tt.expected);
    });
  }
});
