// @vitest-environment node
import { describe, expect, it } from "vitest";
import { scheduleKey, scheduleSchema, schedulesSchema } from "./scheduleSchema";

describe("scheduleSchema", () => {
  const tests: { name: string; input: unknown; expected?: unknown; errorPath?: string }[] = [
    {
      name: "daily needs no day fields",
      input: { cycle: "DAILY" },
      expected: { cycle: "DAILY", dayOfWeek: null, dayOfMonth: null, month: null },
    },
    {
      name: "daily drops irrelevant fields",
      input: { cycle: "DAILY", dayOfMonth: 3 },
      expected: { cycle: "DAILY", dayOfWeek: null, dayOfMonth: null, month: null },
    },
    {
      name: "weekly with dayOfWeek",
      input: { cycle: "WEEKLY", dayOfWeek: 0 },
      expected: { cycle: "WEEKLY", dayOfWeek: 0, dayOfMonth: null, month: null },
    },
    { name: "weekly without dayOfWeek", input: { cycle: "WEEKLY" }, errorPath: "dayOfWeek" },
    { name: "weekly dayOfWeek out of range", input: { cycle: "WEEKLY", dayOfWeek: 7 }, errorPath: "dayOfWeek" },
    {
      name: "monthly coerces numeric strings",
      input: { cycle: "MONTHLY", dayOfMonth: "15" },
      expected: { cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null },
    },
    { name: "monthly day 0", input: { cycle: "MONTHLY", dayOfMonth: 0 }, errorPath: "dayOfMonth" },
    { name: "monthly day 32", input: { cycle: "MONTHLY", dayOfMonth: 32 }, errorPath: "dayOfMonth" },
    { name: "monthly non-integer day", input: { cycle: "MONTHLY", dayOfMonth: 1.5 }, errorPath: "dayOfMonth" },
    {
      name: "yearly with month and day",
      input: { cycle: "YEARLY", month: 3, dayOfMonth: 1 },
      expected: { cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 1, month: 3 },
    },
    {
      name: "yearly accepts Feb 29",
      input: { cycle: "YEARLY", month: 2, dayOfMonth: 29 },
      expected: { cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 29, month: 2 },
    },
    { name: "yearly rejects Feb 30", input: { cycle: "YEARLY", month: 2, dayOfMonth: 30 }, errorPath: "dayOfMonth" },
    { name: "yearly rejects Apr 31", input: { cycle: "YEARLY", month: 4, dayOfMonth: 31 }, errorPath: "dayOfMonth" },
    { name: "yearly without month", input: { cycle: "YEARLY", dayOfMonth: 1 }, errorPath: "month" },
    { name: "yearly month 13", input: { cycle: "YEARLY", month: 13, dayOfMonth: 1 }, errorPath: "month" },
    { name: "unknown cycle", input: { cycle: "HOURLY" }, errorPath: "cycle" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = scheduleSchema.safeParse(tt.input);
      if (tt.errorPath) {
        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(tt.errorPath);
      } else {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(tt.expected);
      }
    });
  }
});

describe("schedulesSchema", () => {
  const monthly = (day: number) => ({ cycle: "MONTHLY", dayOfMonth: day });

  const tests: { name: string; input: unknown; valid: boolean }[] = [
    { name: "multiple distinct schedules", input: [monthly(1), monthly(15)], valid: true },
    { name: "mixed cycles", input: [{ cycle: "DAILY" }, { cycle: "WEEKLY", dayOfWeek: 1 }], valid: true },
    { name: "empty list", input: [], valid: false },
    { name: "duplicate schedules", input: [monthly(1), monthly(1)], valid: false },
    {
      name: "more than 20 schedules",
      input: Array.from({ length: 21 }, (_, i) => monthly((i % 28) + 1)),
      valid: false,
    },
    { name: "not an array", input: undefined, valid: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(schedulesSchema.safeParse(tt.input).success).toBe(tt.valid);
    });
  }
});

describe("scheduleKey", () => {
  const tests = [
    { name: "daily", input: { cycle: "DAILY", dayOfWeek: null, dayOfMonth: null, month: null }, expected: "DAILY|||" },
    { name: "yearly", input: { cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 5, month: 12 }, expected: "YEARLY||5|12" },
  ] as const;

  for (const tt of tests) {
    it(tt.name, () => {
      expect(scheduleKey(tt.input)).toBe(tt.expected);
    });
  }
});
