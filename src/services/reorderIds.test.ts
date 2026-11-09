// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/errors";
import { assertSameIds, sortOrderAt } from "./reorderIds";

describe("sortOrderAt", () => {
  const tests = [
    { name: "first position", index: 0, expected: 10 },
    { name: "second position", index: 1, expected: 20 },
    { name: "tenth position", index: 9, expected: 100 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(sortOrderAt(tt.index)).toBe(tt.expected);
    });
  }
});

describe("assertSameIds", () => {
  const existing = [1, 2, 3];
  const tests: { name: string; ids: number[]; valid: boolean }[] = [
    { name: "accepts the same ids in another order", ids: [3, 1, 2], valid: true },
    { name: "rejects an empty list when ids exist", ids: [], valid: false },
    { name: "rejects a missing id", ids: [1, 2], valid: false },
    { name: "rejects an unknown id", ids: [1, 2, 9], valid: false },
    { name: "rejects a repeated id", ids: [1, 1, 2], valid: false },
    { name: "rejects an extra id", ids: [1, 2, 3, 4], valid: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const check = () => assertSameIds(tt.ids, existing, "不一致");
      if (tt.valid) expect(check).not.toThrow();
      else expect(check).toThrow(new ValidationError("不一致"));
    });
  }

  it("accepts an empty list when there is nothing to order", () => {
    expect(() => assertSameIds([], [], "不一致")).not.toThrow();
  });
});
