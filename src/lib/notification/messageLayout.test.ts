// @vitest-environment node
import { describe, expect, it } from "vitest";
import { capList, moreText } from "./messageLayout";

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
