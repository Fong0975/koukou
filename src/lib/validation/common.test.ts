// @vitest-environment node
import { describe, expect, it } from "vitest";
import { optionalDate, requiredDate } from "./common";

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
