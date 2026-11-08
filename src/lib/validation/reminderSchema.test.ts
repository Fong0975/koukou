// @vitest-environment node
import { describe, expect, it } from "vitest";
import { checkExpiryReminders, remindersSchema } from "./reminderSchema";

describe("remindersSchema", () => {
  const tests: { name: string; input: unknown; expected?: unknown; errorPath?: string }[] = [
    { name: "defaults to no reminders", input: undefined, expected: { chargeDaysBefore: [], expiryDaysBefore: [] } },
    { name: "defaults missing lists", input: {}, expected: { chargeDaysBefore: [], expiryDaysBefore: [] } },
    {
      name: "sorts the chosen days",
      input: { chargeDaysBefore: [7, 0, 3], expiryDaysBefore: [0, 7, 1] },
      expected: { chargeDaysBefore: [0, 3, 7], expiryDaysBefore: [0, 1, 7] },
    },
    {
      name: "accepts the charge day plus 5 custom days",
      input: { chargeDaysBefore: [0, 1, 2, 3, 4, 30] },
      expected: { chargeDaysBefore: [0, 1, 2, 3, 4, 30], expiryDaysBefore: [] },
    },
    {
      name: "rejects more than 5 custom days",
      input: { chargeDaysBefore: [1, 2, 3, 4, 5, 6] },
      errorPath: "chargeDaysBefore",
    },
    { name: "rejects duplicate charge days", input: { chargeDaysBefore: [3, 3] }, errorPath: "chargeDaysBefore" },
    { name: "rejects a charge day above 30", input: { chargeDaysBefore: [31] }, errorPath: "chargeDaysBefore.0" },
    { name: "rejects a negative charge day", input: { chargeDaysBefore: [-1] }, errorPath: "chargeDaysBefore.0" },
    { name: "rejects a fractional charge day", input: { chargeDaysBefore: [1.5] }, errorPath: "chargeDaysBefore.0" },
    { name: "rejects a non-list", input: { chargeDaysBefore: "0" }, errorPath: "chargeDaysBefore" },
    { name: "rejects an unsupported expiry day", input: { expiryDaysBefore: [3] }, errorPath: "expiryDaysBefore.0" },
    { name: "rejects duplicate expiry days", input: { expiryDaysBefore: [7, 7] }, errorPath: "expiryDaysBefore" },
    { name: "rejects a non-object", input: "all", errorPath: "" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = remindersSchema.safeParse(tt.input);
      if (tt.errorPath !== undefined) {
        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(tt.errorPath);
      } else {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(tt.expected);
      }
    });
  }
});

describe("checkExpiryReminders", () => {
  const tests = [
    { name: "allows expiry reminders with a contract end date", contractEndDate: "2027-03-31", days: [7], issues: 0 },
    { name: "allows no expiry reminders without a contract end date", contractEndDate: null, days: [], issues: 0 },
    { name: "rejects expiry reminders without a contract end date", contractEndDate: null, days: [0], issues: 1 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const issues: { path: (string | number)[] }[] = [];
      checkExpiryReminders(
        { contractEndDate: tt.contractEndDate, reminders: { expiryDaysBefore: tt.days } },
        { addIssue: (issue) => issues.push(issue) },
      );
      expect(issues).toHaveLength(tt.issues);
      if (tt.issues) expect(issues[0].path).toEqual(["reminders", "expiryDaysBefore"]);
    });
  }
});
