import { describe, expect, it } from "vitest";
import { moveId } from "./moveId";

describe("moveId", () => {
  const tests: { name: string; ids: number[]; id: number; offset: -1 | 1; expected: number[] | null }[] = [
    { name: "moves an id earlier", ids: [1, 2, 3], id: 2, offset: -1, expected: [2, 1, 3] },
    { name: "moves an id later", ids: [1, 2, 3], id: 2, offset: 1, expected: [1, 3, 2] },
    { name: "cannot move the first id earlier", ids: [1, 2, 3], id: 1, offset: -1, expected: null },
    { name: "cannot move the last id later", ids: [1, 2, 3], id: 3, offset: 1, expected: null },
    { name: "ignores an unknown id", ids: [1, 2, 3], id: 9, offset: 1, expected: null },
    { name: "does not mutate the input", ids: [1, 2], id: 1, offset: 1, expected: [2, 1] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const original = [...tt.ids];
      expect(moveId(tt.ids, tt.id, tt.offset)).toEqual(tt.expected);
      expect(tt.ids).toEqual(original);
    });
  }
});
