// @vitest-environment node
import { describe, expect, it } from "vitest";
import { amountPeriodsSchema, MAX_AMOUNT_PERIODS } from "./amountPeriodSchema";

describe("amountPeriodsSchema", () => {
  const tests: {
    name: string;
    input: unknown;
    expected?: unknown;
    errorPath?: string;
    errorMessage?: string;
  }[] = [
    { name: "defaults to an empty list", input: undefined, expected: [] },
    {
      name: "coerces amounts and keeps dates",
      input: [
        { amount: "100", endDate: "2026-05-31" },
        { amount: 120.5, endDate: "2026-03-31" },
      ],
      expected: [
        { amount: 100, endDate: "2026-05-31" },
        { amount: 120.5, endDate: "2026-03-31" },
      ],
    },
    {
      name: "rejects duplicate end dates on the later row",
      input: [
        { amount: 100, endDate: "2026-05-31" },
        { amount: 120, endDate: "2026-05-31" },
      ],
      errorPath: "1.endDate",
      errorMessage: "到期日不可重複",
    },
    { name: "rejects invalid amount", input: [{ amount: 0, endDate: "2026-05-31" }], errorPath: "0.amount" },
    {
      name: "rejects missing end date",
      input: [{ amount: 100, endDate: "" }],
      errorPath: "0.endDate",
      errorMessage: "請輸入到期日",
    },
    {
      name: "rejects impossible end date",
      input: [{ amount: 100, endDate: "2026-02-30" }],
      errorPath: "0.endDate",
      errorMessage: "到期日不是有效的日期",
    },
    {
      name: "rejects too many periods",
      input: Array.from({ length: MAX_AMOUNT_PERIODS + 1 }, (_, i) => ({
        amount: 100,
        endDate: `${2000 + i}-01-01`,
      })),
      errorPath: "",
    },
    { name: "rejects a non-array", input: "oops", errorPath: "" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = amountPeriodsSchema.safeParse(tt.input);
      if (tt.errorPath === undefined) {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(tt.expected);
        return;
      }
      expect(result.success).toBe(false);
      const issue = result.error?.issues.find((i) => i.path.join(".") === tt.errorPath);
      expect(issue).toBeDefined();
      if (tt.errorMessage) expect(issue?.message).toBe(tt.errorMessage);
    });
  }
});
