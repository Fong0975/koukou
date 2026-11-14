// @vitest-environment node
import { describe, expect, it } from "vitest";
import { errorUnder, toFieldErrors, type FieldErrors } from "./fieldErrors";

describe("toFieldErrors", () => {
  const tests = [
    {
      name: "joins array paths",
      issues: [{ path: ["schedules", 0, "dayOfMonth"], message: "日期需介於 1–31" }],
      expected: { "schedules.0.dayOfMonth": "日期需介於 1–31" },
    },
    {
      name: "accepts string paths from API details",
      issues: [{ path: "name", message: "請輸入項目名稱" }],
      expected: { name: "請輸入項目名稱" },
    },
    {
      name: "keeps the first message per path",
      issues: [
        { path: ["amount"], message: "first" },
        { path: ["amount"], message: "second" },
      ],
      expected: { amount: "first" },
    },
    { name: "empty list", issues: [], expected: {} },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toFieldErrors(tt.issues)).toEqual(tt.expected);
    });
  }
});

describe("errorUnder", () => {
  const tests: { name: string; errors: FieldErrors; expected?: string }[] = [
    {
      name: "prefers the field's own message",
      errors: { "reminders.chargeDaysBefore": "own", "reminders.chargeDaysBefore.0": "nested" },
      expected: "own",
    },
    {
      name: "falls back to a nested message",
      errors: { "reminders.chargeDaysBefore.1": "nested" },
      expected: "nested",
    },
    { name: "ignores fields that only share a prefix", errors: { "reminders.chargeDaysBeforeX": "other" } },
    { name: "no errors", errors: {} },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(errorUnder(tt.errors, "reminders.chargeDaysBefore")).toBe(tt.expected);
    });
  }
});
