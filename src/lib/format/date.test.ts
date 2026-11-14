// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatChargeDate, formatContractRemaining, formatFullDate, formatTimestamp } from "./date";

describe("formatChargeDate", () => {
  const tests = [
    { name: "single-digit month and day", date: "2026-01-01", expected: "1/1（四）" },
    { name: "two-digit month and day", date: "2026-10-17", expected: "10/17（六）" },
    { name: "Sunday", date: "2026-03-01", expected: "3/1（日）" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatChargeDate(tt.date)).toBe(tt.expected);
    });
  }
});

describe("formatFullDate", () => {
  const tests = [
    { name: "keeps zero padding", date: "2027-03-01", expected: "2027/03/01" },
    { name: "two-digit month and day", date: "2026-12-31", expected: "2026/12/31" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatFullDate(tt.date)).toBe(tt.expected);
    });
  }
});

describe("formatTimestamp", () => {
  const tests = [
    {
      name: "formats in local time with zero padding",
      timestamp: new Date(2026, 9, 9, 8, 5).toISOString(),
      expected: "2026/10/09 08:05",
    },
    {
      name: "keeps the evening in 24-hour time",
      timestamp: new Date(2026, 11, 31, 23, 59).toISOString(),
      expected: "2026/12/31 23:59",
    },
    { name: "returns an invalid timestamp unchanged", timestamp: "yesterday", expected: "yesterday" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatTimestamp(tt.timestamp)).toBe(tt.expected);
    });
  }
});

describe("formatContractRemaining", () => {
  const tests = [
    { name: "days left", days: 12, expected: "剩 12 天" },
    { name: "one day left", days: 1, expected: "剩 1 天" },
    { name: "ends today", days: 0, expected: "今天到期" },
    { name: "already ended", days: -3, expected: "已到期 3 天" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatContractRemaining(tt.days)).toBe(tt.expected);
    });
  }
});
