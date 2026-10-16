// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeCategory, makeSubscription } from "@/test/fixtures";
import { groupByCategory } from "./groupByCategory";

const video = makeCategory({ id: 2, name: "影音串流", sortOrder: 20 });
const music = makeCategory({ id: 1, name: "音樂", sortOrder: 10 });
const tools = makeCategory({ id: 5, name: "工具", sortOrder: 20 });

describe("groupByCategory", () => {
  const tests = [
    { name: "no subscriptions", items: [], expected: [] },
    {
      name: "orders groups by sort order, then id, and items by name",
      items: [
        makeSubscription({ id: 1, name: "Netflix", category: video }),
        makeSubscription({ id: 2, name: "Notion", category: tools }),
        makeSubscription({ id: 3, name: "Disney+", category: video }),
        makeSubscription({ id: 4, name: "Spotify", category: music }),
      ],
      expected: [
        { category: "音樂", items: ["Spotify"] },
        { category: "影音串流", items: ["Disney+", "Netflix"] },
        { category: "工具", items: ["Notion"] },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = groupByCategory(tt.items).map(({ category, items }) => ({
        category: category.name,
        items: items.map((item) => item.name),
      }));

      expect(result).toEqual(tt.expected);
    });
  }
});
