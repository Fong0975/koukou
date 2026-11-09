// @vitest-environment node
import { describe, expect, it } from "vitest";
import { paymentMethodInputSchema, paymentMethodOrderSchema } from "./paymentMethodSchema";

describe("paymentMethodInputSchema", () => {
  const tests: { name: string; input: unknown; expected?: unknown; errorPath?: string }[] = [
    {
      name: "credit card with name",
      input: { type: "CREDIT_CARD", name: " 國泰 CUBE " },
      expected: { type: "CREDIT_CARD", name: "國泰 CUBE", note: null },
    },
    {
      name: "bank account with note",
      input: { type: "BANK_ACCOUNT", name: "台新 Richart", note: "薪轉戶" },
      expected: { type: "BANK_ACCOUNT", name: "台新 Richart", note: "薪轉戶" },
    },
    { name: "rejects unknown type", input: { type: "CASH", name: "x" }, errorPath: "type" },
    { name: "rejects missing type", input: { name: "x" }, errorPath: "type" },
    { name: "rejects blank name", input: { type: "OTHER", name: " " }, errorPath: "name" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = paymentMethodInputSchema.safeParse(tt.input);
      if (tt.errorPath) {
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(tt.errorPath);
      } else {
        expect(result.data).toEqual(tt.expected);
      }
    });
  }
});

describe("paymentMethodOrderSchema", () => {
  const tests: { name: string; input: unknown; expected?: unknown; error?: { path: string; message?: string } }[] = [
    { name: "keeps numeric ids", input: { ids: [4, 3, 5] }, expected: { ids: [4, 3, 5] } },
    { name: "coerces numeric strings", input: { ids: ["4", "3"] }, expected: { ids: [4, 3] } },
    { name: "rejects an empty list", input: { ids: [] }, error: { path: "ids", message: "請提供扣款方式排序" } },
    { name: "rejects a missing list", input: {}, error: { path: "ids" } },
    { name: "rejects non-numeric ids", input: { ids: ["x"] }, error: { path: "ids.0", message: "請選擇扣款方式" } },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = paymentMethodOrderSchema.safeParse(tt.input);
      if (tt.error) {
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(tt.error.path);
        if (tt.error.message) expect(result.error?.issues.map((issue) => issue.message)).toContain(tt.error.message);
      } else {
        expect(result.data).toEqual(tt.expected);
      }
    });
  }
});
