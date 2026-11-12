// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { PauseDto } from "@/types/dto";
import { isPausedOn, pauseStatusOn, type PauseStatus } from "./pauses";

const spring: PauseDto = { id: 1, startDate: "2026-03-01", endDate: "2026-04-30" };
const cancelled: PauseDto = { id: 2, startDate: "2026-08-01", endDate: null };

describe("isPausedOn", () => {
  const tests: { name: string; pauses: PauseDto[]; date: string; expected: boolean }[] = [
    { name: "no pauses", pauses: [], date: "2026-03-15", expected: false },
    { name: "the day before a pause", pauses: [spring], date: "2026-02-28", expected: false },
    { name: "the first day of a pause", pauses: [spring], date: "2026-03-01", expected: true },
    { name: "the last day of a pause", pauses: [spring], date: "2026-04-30", expected: true },
    { name: "the day after a pause", pauses: [spring], date: "2026-05-01", expected: false },
    { name: "between two pauses", pauses: [spring, cancelled], date: "2026-07-31", expected: false },
    { name: "far ahead in an open-ended pause", pauses: [spring, cancelled], date: "2099-01-01", expected: true },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isPausedOn(tt.pauses, tt.date)).toBe(tt.expected);
    });
  }
});

describe("pauseStatusOn", () => {
  const tests: { name: string; pauses: PauseDto[]; date: string; expected: PauseStatus | null }[] = [
    { name: "not paused without pauses", pauses: [], date: "2026-03-15", expected: null },
    { name: "not paused outside the pauses", pauses: [spring, cancelled], date: "2026-06-15", expected: null },
    {
      name: "paused until the pause's end date",
      pauses: [spring, cancelled],
      date: "2026-03-15",
      expected: { kind: "paused", until: "2026-04-30" },
    },
    {
      name: "cancelled since the open-ended pause's start date",
      pauses: [spring, cancelled],
      date: "2026-08-01",
      expected: { kind: "cancelled", since: "2026-08-01" },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(pauseStatusOn({ pauses: tt.pauses }, tt.date)).toEqual(tt.expected);
    });
  }
});
