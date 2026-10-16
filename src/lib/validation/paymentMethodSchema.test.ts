// @vitest-environment node
import { describe, expect, it } from "vitest";
import { paymentMethodInputSchema } from "./paymentMethodSchema";

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
