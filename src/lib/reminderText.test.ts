// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatChargeReminderDay, formatExpiryReminderDay, formatReminders } from "./reminderText";

describe("formatChargeReminderDay", () => {
  const tests = [
    { name: "the charge day", day: 0, expected: "扣款當日" },
    { name: "days ahead", day: 3, expected: "扣款前 3 天" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatChargeReminderDay(tt.day)).toBe(tt.expected);
    });
  }
});

describe("formatExpiryReminderDay", () => {
  const tests = [
    { name: "the last day", day: 0, expected: "到期當日" },
    { name: "days ahead", day: 7, expected: "到期前 7 天" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatExpiryReminderDay(tt.day)).toBe(tt.expected);
    });
  }
});

describe("formatReminders", () => {
  const tests = [
    { name: "no reminders", chargeDaysBefore: [], expiryDaysBefore: [], expected: null },
    {
      name: "charge reminders only",
      chargeDaysBefore: [0, 3],
      expiryDaysBefore: [],
      expected: "LINE 提醒：扣款當日、扣款前 3 天",
    },
    {
      name: "charge and expiry reminders",
      chargeDaysBefore: [1],
      expiryDaysBefore: [0, 7],
      expected: "LINE 提醒：扣款前 1 天、到期當日、到期前 7 天",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatReminders({ chargeDaysBefore: tt.chargeDaysBefore, expiryDaysBefore: tt.expiryDaysBefore })).toBe(
        tt.expected,
      );
    });
  }
});
