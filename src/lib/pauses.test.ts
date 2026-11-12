// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { PauseDto } from "@/types/dto";
import { isPausedOn, pauseStatusOn, splitByPauseStatus, type PauseStatus } from "./pauses";

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

describe("splitByPauseStatus", () => {
  const netflix = makeSubscription({ id: 1, name: "Netflix" });
  const spotify = makeSubscription({ id: 2, name: "Spotify", pauses: [spring] });
  const apple = makeSubscription({ id: 3, name: "Apple", pauses: [spring] });
  const gym = makeSubscription({ id: 4, name: "Gym", pauses: [{ id: 3, startDate: "2026-03-10", endDate: null }] });
  const items = [netflix, gym, spotify, apple];

  const tests: { name: string; date: string | null; active: string[]; paused: [string, PauseStatus["kind"]][] }[] = [
    {
      name: "keeps everything running without a date",
      date: null,
      active: ["Netflix", "Gym", "Spotify", "Apple"],
      paused: [],
    },
    {
      name: "keeps everything running before the pauses",
      date: "2026-02-15",
      active: ["Netflix", "Gym", "Spotify", "Apple"],
      paused: [],
    },
    {
      name: "moves paused and cancelled ones out, paused first, each by name",
      date: "2026-03-15",
      active: ["Netflix"],
      paused: [
        ["Apple", "paused"],
        ["Spotify", "paused"],
        ["Gym", "cancelled"],
      ],
    },
    {
      name: "brings resumed ones back in input order",
      date: "2026-06-15",
      active: ["Netflix", "Spotify", "Apple"],
      paused: [["Gym", "cancelled"]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = splitByPauseStatus(items, tt.date);
      expect(result.active.map(({ name }) => name)).toEqual(tt.active);
      expect(result.paused.map(({ item, status }) => [item.name, status.kind])).toEqual(tt.paused);
    });
  }
});
