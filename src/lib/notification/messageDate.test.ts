// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatMessageDate, formatMonthDay, formatPaddedDate, whenText } from "./messageDate";

describe("formatMonthDay", () => {
  const tests = [
    { name: "drops leading zeros", date: "2026-01-05", expected: "1/5" },
    { name: "keeps two-digit parts", date: "2026-11-15", expected: "11/15" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatMonthDay(tt.date)).toBe(tt.expected);
    });
  }
});

describe("formatMessageDate", () => {
  const tests = [
    { name: "adds a Sunday", date: "2026-11-15", expected: "11/15 (日)" },
    { name: "adds a Tuesday", date: "2026-12-01", expected: "12/1 (二)" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatMessageDate(tt.date)).toBe(tt.expected);
    });
  }
});

describe("formatPaddedDate", () => {
  const tests = [
    { name: "pads month and day", date: "2026-01-05", expected: "01/05(一)" },
    { name: "keeps two-digit parts", date: "2026-11-12", expected: "11/12(四)" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatPaddedDate(tt.date)).toBe(tt.expected);
    });
  }
});

describe("whenText", () => {
  const tests = [
    { name: "the day itself", daysBefore: 0, expected: "今天" },
    { name: "tomorrow", daysBefore: 1, expected: "明天" },
    { name: "later days", daysBefore: 3, expected: "3 天後" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(whenText(tt.daysBefore)).toBe(tt.expected);
    });
  }
});
