// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isCatchAllCategory, isPinnedCatchAll } from "./catchAllCategory";

describe("isCatchAllCategory", () => {
  const tests = [
    { name: "the catch-all", category: { name: "其他" }, expected: true },
    { name: "another category", category: { name: "影音串流" }, expected: false },
    { name: "a renamed catch-all", category: { name: "其它" }, expected: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isCatchAllCategory(tt.category)).toBe(tt.expected);
    });
  }
});

describe("isPinnedCatchAll", () => {
  const ordered = [{ name: "影音串流" }, { name: "電信費" }, { name: "其他" }];
  const tests = [
    { name: "the catch-all at the end is pinned", categories: ordered, index: 2, expected: true },
    { name: "another category is not pinned", categories: ordered, index: 1, expected: false },
    {
      name: "a catch-all that is not last is not pinned",
      categories: [{ name: "其他" }, { name: "影音串流" }],
      index: 0,
      expected: false,
    },
    {
      name: "a last category with another name is not pinned",
      categories: ordered.slice(0, 2),
      index: 1,
      expected: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isPinnedCatchAll(tt.categories, tt.index)).toBe(tt.expected);
    });
  }
});
