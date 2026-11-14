// @vitest-environment node
import { describe, expect, it } from "vitest";
import { duplicateIndexes, isUniqueBy, optionalDate, requiredDate } from "./common";

describe("requiredDate", () => {
  const schema = requiredDate("起始日");
  const tests = [
    { name: "accepts a valid date", value: "2026-10-17", expected: "2026-10-17" },
    { name: "trims spaces", value: " 2026-10-17 ", expected: "2026-10-17" },
    { name: "rejects blank", value: "  ", error: "請輸入起始日" },
    { name: "rejects missing", value: undefined, error: "請輸入起始日" },
    { name: "rejects impossible date", value: "2026-02-30", error: "起始日不是有效的日期" },
    { name: "rejects other formats", value: "2026/10/17", error: "起始日不是有效的日期" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = schema.safeParse(tt.value);
      if (tt.error) {
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(tt.error);
      } else {
        expect(result.data).toBe(tt.expected);
      }
    });
  }
});

describe("optionalDate", () => {
  const schema = optionalDate("合約到期日");
  const tests: { name: string; value: unknown; expected?: string | null; error?: string }[] = [
    { name: "accepts a valid date", value: "2027-03-31", expected: "2027-03-31" },
    { name: "trims spaces", value: " 2027-03-31 ", expected: "2027-03-31" },
    { name: "normalizes blank to null", value: "  ", expected: null },
    { name: "normalizes missing to null", value: undefined, expected: null },
    { name: "keeps null", value: null, expected: null },
    { name: "rejects impossible date", value: "2027-02-30", error: "合約到期日不是有效的日期" },
    { name: "rejects other formats", value: "2027/03/31", error: "合約到期日不是有效的日期" },
    { name: "rejects non-strings", value: 20270331, error: "合約到期日不是有效的日期" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = schema.safeParse(tt.value);
      if (tt.error) {
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(tt.error);
      } else {
        expect(result.success).toBe(true);
        expect(result.data).toBe(tt.expected);
      }
    });
  }
});

describe("duplicateIndexes", () => {
  const tests: { name: string; items: string[]; expected: number[] }[] = [
    { name: "finds nothing in a unique list", items: ["a", "b"], expected: [] },
    { name: "points at every repeat but not the first occurrence", items: ["a", "b", "a", "a"], expected: [2, 3] },
    { name: "finds nothing in an empty list", items: [], expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(duplicateIndexes(tt.items, (item) => item)).toEqual(tt.expected);
    });
  }
});

describe("isUniqueBy", () => {
  type Item = { id: number };
  const byId = (item: Item) => item.id;
  const tests: { name: string; items: Item[]; keyOf?: (item: Item) => unknown; expected: boolean }[] = [
    { name: "distinct keys", items: [{ id: 1 }, { id: 2 }], keyOf: byId, expected: true },
    { name: "a repeated key", items: [{ id: 1 }, { id: 1 }], keyOf: byId, expected: false },
    {
      name: "compares the items themselves by default, so equal objects differ",
      items: [{ id: 1 }, { id: 1 }],
      expected: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isUniqueBy(tt.items, tt.keyOf)).toBe(tt.expected);
    });
  }
});
