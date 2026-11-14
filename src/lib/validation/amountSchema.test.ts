// @vitest-environment node
import { describe, expect, it } from "vitest";
import { amountSchema } from "./amountSchema";

describe("amountSchema", () => {
  const tests: { name: string; input: unknown; expected?: number; error?: string }[] = [
    { name: "accepts a whole amount", input: 390, expected: 390 },
    { name: "coerces a typed string", input: "15.49", expected: 15.49 },
    { name: "accepts zero for a free period", input: "0", expected: 0 },
    { name: "accepts two decimals that are inexact in floating point", input: "19.99", expected: 19.99 },
    { name: "accepts the largest DECIMAL(12, 2) value", input: "9999999999.99", expected: 9_999_999_999.99 },
    { name: "rejects a negative amount", input: "-1", error: "金額不可小於 0" },
    { name: "rejects more than two decimals", input: "1.005", error: "金額最多兩位小數" },
    { name: "rejects an amount that does not fit the column", input: "10000000000", error: "金額過大" },
    { name: "rejects text", input: "abc", error: "請輸入金額" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = amountSchema.safeParse(tt.input);
      if (tt.error) {
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe(tt.error);
      } else {
        expect(result.data).toBe(tt.expected);
      }
    });
  }
});
