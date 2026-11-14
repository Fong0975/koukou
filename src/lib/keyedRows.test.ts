// @vitest-environment node
import { describe, expect, it } from "vitest";
import { patchRow, removeRow } from "./keyedRows";

const rows = [
  { key: "a", value: "1" },
  { key: "b", value: "2" },
];

describe("patchRow", () => {
  const tests = [
    {
      name: "changes only the matching row",
      key: "b",
      expected: [
        { key: "a", value: "1" },
        { key: "b", value: "9" },
      ],
    },
    { name: "leaves the list alone for an unknown key", key: "x", expected: rows },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(patchRow(rows, tt.key, { value: "9" })).toEqual(tt.expected);
    });
  }
});

describe("removeRow", () => {
  const tests = [
    { name: "drops the matching row", key: "a", expected: [{ key: "b", value: "2" }] },
    { name: "leaves the list alone for an unknown key", key: "x", expected: rows },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(removeRow(rows, tt.key)).toEqual(tt.expected);
    });
  }
});
