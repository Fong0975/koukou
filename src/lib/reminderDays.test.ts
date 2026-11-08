// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isExpiryReminderDay, parseCustomReminderDay, toggleDay } from "./reminderDays";

describe("toggleDay", () => {
  const tests = [
    { name: "adds a day in order", days: [0, 7], day: 3, on: true, expected: [0, 3, 7] },
    { name: "adding an existing day keeps one", days: [0, 3], day: 3, on: true, expected: [0, 3] },
    { name: "removes a day", days: [0, 3, 7], day: 3, on: false, expected: [0, 7] },
    { name: "removing a missing day changes nothing", days: [1], day: 0, on: false, expected: [1] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toggleDay(tt.days, tt.day, tt.on)).toEqual(tt.expected);
    });
  }
});

describe("parseCustomReminderDay", () => {
  const tests = [
    { name: "accepts a day", text: " 7 ", days: [0], expected: { day: 7 } },
    { name: "accepts the largest day", text: "30", days: [], expected: { day: 30 } },
    { name: "rejects blank input", text: "  ", days: [], expected: { error: "請輸入天數" } },
    { name: "rejects zero", text: "0", days: [], expected: { error: "天數需為 1–30 的整數" } },
    { name: "rejects more than 30", text: "31", days: [], expected: { error: "天數需為 1–30 的整數" } },
    { name: "rejects a fraction", text: "1.5", days: [], expected: { error: "天數需為 1–30 的整數" } },
    { name: "rejects a duplicate", text: "3", days: [0, 3], expected: { error: "已經有 3 天前的提醒" } },
    {
      name: "rejects a sixth custom day",
      text: "9",
      days: [0, 1, 2, 3, 4, 5],
      expected: { error: "自訂提醒最多 5 個" },
    },
    { name: "the charge day does not count as custom", text: "9", days: [0, 1, 2, 3, 4], expected: { day: 9 } },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(parseCustomReminderDay(tt.text, tt.days)).toEqual(tt.expected);
    });
  }
});

describe("isExpiryReminderDay", () => {
  const tests = [
    { name: "7 days before", day: 7, expected: true },
    { name: "1 day before", day: 1, expected: true },
    { name: "the last day", day: 0, expected: true },
    { name: "a day not offered", day: 3, expected: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isExpiryReminderDay(tt.day)).toBe(tt.expected);
    });
  }
});
