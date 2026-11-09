// @vitest-environment node
import { describe, expect, it } from "vitest";
import { capList, fitToLimit, joinBlocks, MAX_MESSAGE_LENGTH, moreText } from "./messageLayout";

describe("capList", () => {
  const tests = [
    { name: "keeps a short list whole", items: [1, 2], cap: 5, shown: [1, 2], hidden: 0 },
    { name: "cuts a long list", items: [1, 2, 3, 4], cap: 2, shown: [1, 2], hidden: 2 },
    { name: "keeps nothing at cap 0", items: [1, 2], cap: 0, shown: [], hidden: 2 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(capList(tt.items, tt.cap)).toEqual({ shown: tt.shown, hidden: tt.hidden });
    });
  }
});

describe("moreText", () => {
  const tests = [{ name: "counts the hidden items", hidden: 3, expected: "…另 3 項" }];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(moreText(tt.hidden)).toBe(tt.expected);
    });
  }
});

describe("joinBlocks", () => {
  const tests = [
    { name: "puts a blank line between blocks", blocks: [["a"], ["b", "c"]], expected: ["a", "", "b", "c"] },
    { name: "keeps a single block as is", blocks: [["a"]], expected: ["a"] },
    { name: "returns nothing for no blocks", blocks: [], expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(joinBlocks(tt.blocks)).toEqual(tt.expected);
    });
  }
});

describe("fitToLimit", () => {
  const line = "x".repeat(99);
  const rendersCap = (cap: number) => Array.from({ length: cap }, () => line).join("\n");

  const tests = [
    { name: "returns the full message when it fits", render: rendersCap, longest: 10, expectedLength: 10 * 100 - 1 },
    { name: "cuts to the largest cap that fits", render: rendersCap, longest: 100, expectedLength: 50 * 100 - 1 },
    {
      name: "truncates when even the fixed lines do not fit",
      render: () => "y".repeat(MAX_MESSAGE_LENGTH + 10),
      longest: 3,
      expectedLength: MAX_MESSAGE_LENGTH,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const message = fitToLimit(tt.render, tt.longest);
      expect(message).toHaveLength(tt.expectedLength);
      expect(message.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
    });
  }
});
