// @vitest-environment node
import { describe, expect, it } from "vitest";
import { exchangeRateQuerySchema } from "./exchangeRateSchema";

describe("exchangeRateQuerySchema", () => {
  const tests: { name: string; input: unknown; expected?: unknown; errorMessage?: string }[] = [
    { name: "parses the year", input: { year: "2026" }, expected: { year: 2026 } },
    { name: "accepts the first supported year", input: { year: "1999" }, expected: { year: 1999 } },
    { name: "rejects a missing year", input: {}, errorMessage: "年份格式錯誤" },
    { name: "rejects a blank year", input: { year: "" }, errorMessage: "年份格式錯誤" },
    { name: "rejects text", input: { year: "abcd" }, errorMessage: "年份格式錯誤" },
    { name: "rejects a decimal", input: { year: "2026.5" }, errorMessage: "年份格式錯誤" },
    {
      name: "rejects years before the data starts",
      input: { year: "1998" },
      errorMessage: "僅支援 1999 年以後的匯率",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = exchangeRateQuerySchema.safeParse(tt.input);
      if (tt.errorMessage) {
        expect(result.error?.issues.map((issue) => issue.message)).toEqual([tt.errorMessage]);
      } else {
        expect(result.data).toEqual(tt.expected);
      }
    });
  }
});
