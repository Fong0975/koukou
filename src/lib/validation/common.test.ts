// @vitest-environment node
import { describe, expect, it } from "vitest";
import { requiredDate } from "./common";

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
