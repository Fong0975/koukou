// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isSendTimeReached } from "./sendTime";

const at = (hours: number, minutes: number) => new Date(2026, 10, 8, hours, minutes, 30);

describe("isSendTimeReached", () => {
  const tests = [
    { name: "a minute before", now: at(8, 59), sendTime: "09:00", expected: false },
    { name: "exactly on time", now: at(9, 0), sendTime: "09:00", expected: true },
    { name: "later that day", now: at(23, 59), sendTime: "09:00", expected: true },
    { name: "midnight send time at midnight", now: at(0, 0), sendTime: "00:00", expected: true },
    { name: "compares hours as numbers, not text", now: at(10, 0), sendTime: "09:30", expected: true },
    { name: "late send time early in the day", now: at(7, 5), sendTime: "21:00", expected: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isSendTimeReached(tt.now, tt.sendTime)).toBe(tt.expected);
    });
  }
});
