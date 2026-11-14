// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/errors";
import { assertSameIds, planInsertion, sortOrderAt, type SortedRow } from "./sortOrder";

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
  const tests: { name: string; ids: number[]; existing?: number[]; valid: boolean }[] = [
    { name: "accepts the same ids in another order", ids: [3, 1, 2], valid: true },
    { name: "accepts an empty list when there is nothing to order", ids: [], existing: [], valid: true },
    { name: "rejects an empty list when ids exist", ids: [], valid: false },
    { name: "rejects a missing id", ids: [1, 2], valid: false },
    { name: "rejects an unknown id", ids: [1, 2, 9], valid: false },
    { name: "rejects a repeated id", ids: [1, 1, 2], valid: false },
    { name: "rejects an extra id", ids: [1, 2, 3, 4], valid: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const check = () => assertSameIds(tt.ids, tt.existing ?? [1, 2, 3], "不一致");
      if (tt.valid) expect(check).not.toThrow();
      else expect(check).toThrow(new ValidationError("不一致"));
    });
  }
});

describe("planInsertion", () => {
  type Row = SortedRow & { name: string };
  const isCatchAll = (row: Row) => row.name === "其他";
  const tests: { name: string; rows: Row[]; staysLast?: (row: Row) => boolean; expected: unknown }[] = [
    { name: "first row of an empty list", rows: [], staysLast: isCatchAll, expected: { sortOrder: 10 } },
    {
      name: "one step after the last row",
      rows: [
        { id: 1, name: "a", sortOrder: 10 },
        { id: 2, name: "b", sortOrder: 20 },
      ],
      expected: { sortOrder: 30 },
    },
    {
      name: "after an unordered last row",
      rows: [{ id: 1, name: "a", sortOrder: 500 }],
      expected: { sortOrder: 510 },
    },
    {
      name: "takes the place of a last row that stays last and moves it down",
      rows: [
        { id: 1, name: "a", sortOrder: 10 },
        { id: 7, name: "其他", sortOrder: 20 },
      ],
      staysLast: isCatchAll,
      expected: { sortOrder: 20, moved: { id: 7, sortOrder: 30 } },
    },
    {
      name: "keeps the seeded catch-all last",
      rows: [
        { id: 6, name: "水電瓦斯", sortOrder: 60 },
        { id: 7, name: "其他", sortOrder: 999 },
      ],
      staysLast: isCatchAll,
      expected: { sortOrder: 999, moved: { id: 7, sortOrder: 1009 } },
    },
    {
      name: "appends when the catch-all is not last",
      rows: [
        { id: 7, name: "其他", sortOrder: 10 },
        { id: 1, name: "a", sortOrder: 20 },
      ],
      staysLast: isCatchAll,
      expected: { sortOrder: 30 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(planInsertion(tt.rows, tt.staysLast)).toEqual(tt.expected);
    });
  }
});
