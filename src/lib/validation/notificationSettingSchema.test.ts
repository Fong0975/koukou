// @vitest-environment node
import { describe, expect, it } from "vitest";
import { notificationSettingInputSchema } from "./notificationSettingSchema";

const valid = { enabled: true, monthlySummaryEnabled: false, sendTime: "09:00" };

describe("notificationSettingInputSchema", () => {
  const tests: { name: string; input: unknown; expected?: unknown; errorPath?: string }[] = [
    { name: "accepts valid settings", input: valid, expected: valid },
    {
      name: "trims the send time",
      input: { ...valid, sendTime: " 23:59 " },
      expected: { ...valid, sendTime: "23:59" },
    },
    { name: "accepts midnight", input: { ...valid, sendTime: "00:00" }, expected: { ...valid, sendTime: "00:00" } },
    { name: "rejects hour 24", input: { ...valid, sendTime: "24:00" }, errorPath: "sendTime" },
    { name: "rejects minute 60", input: { ...valid, sendTime: "09:60" }, errorPath: "sendTime" },
    { name: "rejects a single-digit hour", input: { ...valid, sendTime: "9:00" }, errorPath: "sendTime" },
    { name: "rejects seconds", input: { ...valid, sendTime: "09:00:00" }, errorPath: "sendTime" },
    { name: "rejects a missing send time", input: { ...valid, sendTime: undefined }, errorPath: "sendTime" },
    { name: "rejects a non-boolean switch", input: { ...valid, enabled: "yes" }, errorPath: "enabled" },
    {
      name: "rejects a missing summary switch",
      input: { ...valid, monthlySummaryEnabled: undefined },
      errorPath: "monthlySummaryEnabled",
    },
    { name: "rejects a non-object", input: null, errorPath: "" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = notificationSettingInputSchema.safeParse(tt.input);
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
