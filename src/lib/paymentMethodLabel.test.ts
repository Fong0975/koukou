import { describe, expect, it } from "vitest";
import { makePaymentMethod } from "@/test/fixtures";
import { paymentMethodOptionLabel } from "./paymentMethodLabel";

describe("paymentMethodOptionLabel", () => {
  const tests = [
    {
      name: "type and name when there is no note",
      method: makePaymentMethod({ type: "CREDIT_CARD", name: "國泰 CUBE", note: null }),
      expected: "信用卡｜國泰 CUBE",
    },
    {
      name: "appends the note in parentheses",
      method: makePaymentMethod({ type: "CREDIT_CARD", name: "國泰 CUBE", note: "主力卡" }),
      expected: "信用卡｜國泰 CUBE（主力卡）",
    },
    {
      name: "uses the label of the type",
      method: makePaymentMethod({ type: "BANK_ACCOUNT", name: "台新 Richart", note: "薪轉" }),
      expected: "帳戶扣款｜台新 Richart（薪轉）",
    },
    {
      name: "an empty note is ignored",
      method: makePaymentMethod({ type: "OTHER", name: "現金", note: "" }),
      expected: "其他｜現金",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(paymentMethodOptionLabel(tt.method)).toBe(tt.expected);
    });
  }
});
