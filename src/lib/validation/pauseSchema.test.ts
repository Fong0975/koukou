// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MAX_PAUSES, pausesSchema } from "./pauseSchema";

describe("pausesSchema", () => {
  const tests: {
    name: string;
    input: unknown;
    expected?: unknown;
    errorPath?: string;
    errorMessage?: string;
    onlyIssue?: boolean;
  }[] = [
    { name: "defaults to an empty list", input: undefined, expected: [] },
    {
      name: "keeps trimmed dates",
      input: [{ startDate: " 2026-03-01 ", endDate: "2026-04-30 " }],
      expected: [{ startDate: "2026-03-01", endDate: "2026-04-30" }],
    },
    {
      name: "rejects a blank end date",
      input: [{ startDate: "2026-08-01", endDate: "" }],
      errorPath: "0.endDate",
      errorMessage: "請輸入暫停結束日",
    },
    {
      name: "rejects a missing end date",
      input: [{ startDate: "2026-08-01" }],
      errorPath: "0.endDate",
      errorMessage: "請輸入暫停結束日",
    },
    {
      name: "accepts a single-day pause",
      input: [{ startDate: "2026-03-01", endDate: "2026-03-01" }],
      expected: [{ startDate: "2026-03-01", endDate: "2026-03-01" }],
    },
    {
      name: "accepts pauses in any order",
      input: [
        { startDate: "2026-08-01", endDate: "2026-08-31" },
        { startDate: "2026-03-01", endDate: "2026-04-30" },
      ],
      expected: [
        { startDate: "2026-08-01", endDate: "2026-08-31" },
        { startDate: "2026-03-01", endDate: "2026-04-30" },
      ],
    },
    {
      name: "accepts a pause starting the day after the previous one ends",
      input: [
        { startDate: "2026-03-01", endDate: "2026-04-30" },
        { startDate: "2026-05-01", endDate: "2026-05-31" },
      ],
      expected: [
        { startDate: "2026-03-01", endDate: "2026-04-30" },
        { startDate: "2026-05-01", endDate: "2026-05-31" },
      ],
    },
    {
      name: "rejects an end date before the start date",
      input: [{ startDate: "2026-03-01", endDate: "2026-02-28" }],
      errorPath: "0.endDate",
      errorMessage: "結束日不可早於開始日",
    },
    {
      name: "rejects a pause starting on the day the previous one ends",
      input: [
        { startDate: "2026-05-01", endDate: "2026-05-31" },
        { startDate: "2026-03-01", endDate: "2026-05-01" },
      ],
      errorPath: "0.startDate",
      errorMessage: "暫停期間不可重疊",
    },
    {
      name: "rejects two pauses starting on the same day on the later row",
      input: [
        { startDate: "2026-03-01", endDate: "2026-03-31" },
        { startDate: "2026-03-01", endDate: "2026-04-30" },
      ],
      errorPath: "1.startDate",
      errorMessage: "暫停期間不可重疊",
    },
    {
      name: "rejects a missing start date",
      input: [{ startDate: "", endDate: "2026-03-31" }],
      errorPath: "0.startDate",
      errorMessage: "請輸入暫停開始日",
    },
    {
      name: "rejects an impossible end date",
      input: [{ startDate: "2026-02-01", endDate: "2026-02-30" }],
      errorPath: "0.endDate",
      errorMessage: "暫停結束日不是有效的日期",
    },
    {
      name: "rejects too many pauses",
      input: Array.from({ length: MAX_PAUSES + 1 }, (_, i) => ({
        startDate: `${2000 + i}-01-01`,
        endDate: `${2000 + i}-01-31`,
      })),
      errorPath: "",
      errorMessage: `暫停期間最多 ${MAX_PAUSES} 筆`,
      onlyIssue: true,
    },
    { name: "rejects a non-array", input: "oops", errorPath: "", errorMessage: "暫停期間格式錯誤" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = pausesSchema.safeParse(tt.input);
      if (tt.errorPath === undefined) {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(tt.expected);
        return;
      }
      expect(result.success).toBe(false);
      const issue = result.error?.issues.find((i) => i.path.join(".") === tt.errorPath);
      expect(issue).toBeDefined();
      if (tt.errorMessage) expect(issue?.message).toBe(tt.errorMessage);
      if (tt.onlyIssue) expect(result.error?.issues).toHaveLength(1);
    });
  }
});
