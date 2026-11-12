// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { PauseDto } from "@/types/dto";
import { isPausedOn, pauseOn } from "./pauses";

const spring: PauseDto = { id: 1, startDate: "2026-03-01", endDate: "2026-04-30" };
const summer: PauseDto = { id: 2, startDate: "2026-08-01", endDate: "2026-08-31" };

describe("pauseOn", () => {
  const tests: { name: string; pauses: PauseDto[]; date: string; expected: PauseDto | undefined }[] = [
    { name: "no pauses", pauses: [], date: "2026-03-15", expected: undefined },
    { name: "the day before a pause", pauses: [spring, summer], date: "2026-02-28", expected: undefined },
    { name: "the first day of a pause", pauses: [spring, summer], date: "2026-03-01", expected: spring },
    { name: "the last day of a pause", pauses: [spring, summer], date: "2026-04-30", expected: spring },
    { name: "the day after a pause", pauses: [spring, summer], date: "2026-05-01", expected: undefined },
    { name: "inside a later pause", pauses: [spring, summer], date: "2026-08-15", expected: summer },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(pauseOn(tt.pauses, tt.date)).toBe(tt.expected);
    });
  }
});

describe("isPausedOn", () => {
  const tests: { name: string; pauses: PauseDto[]; date: string; expected: boolean }[] = [
    { name: "no pauses", pauses: [], date: "2026-03-15", expected: false },
    { name: "inside a pause", pauses: [spring, summer], date: "2026-04-30", expected: true },
    { name: "between two pauses", pauses: [spring, summer], date: "2026-07-31", expected: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isPausedOn(tt.pauses, tt.date)).toBe(tt.expected);
    });
  }
});
