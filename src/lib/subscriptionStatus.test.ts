// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { PauseDto } from "@/types/dto";
import { splitByStatus, subscriptionStatusOn, type SubscriptionStatus } from "./subscriptionStatus";

const spring: PauseDto = { id: 1, startDate: "2026-03-01", endDate: "2026-04-30" };

describe("subscriptionStatusOn", () => {
  const tests: {
    name: string;
    contractEndDate: string | null;
    pauses: PauseDto[];
    date: string;
    expected: SubscriptionStatus | null;
  }[] = [
    {
      name: "runs without an end date or pauses",
      contractEndDate: null,
      pauses: [],
      date: "2026-03-15",
      expected: null,
    },
    { name: "runs outside its pauses", contractEndDate: null, pauses: [spring], date: "2026-05-01", expected: null },
    {
      name: "paused until the pause's end date",
      contractEndDate: null,
      pauses: [spring],
      date: "2026-03-01",
      expected: { kind: "paused", until: "2026-04-30" },
    },
    {
      name: "still runs on its end date",
      contractEndDate: "2026-06-30",
      pauses: [],
      date: "2026-06-30",
      expected: null,
    },
    {
      name: "ended from the day after its end date",
      contractEndDate: "2026-06-30",
      pauses: [],
      date: "2026-07-01",
      expected: { kind: "ended", endDate: "2026-06-30" },
    },
    {
      name: "a pause before the end date still shows as paused",
      contractEndDate: "2026-06-30",
      pauses: [spring],
      date: "2026-04-01",
      expected: { kind: "paused", until: "2026-04-30" },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(subscriptionStatusOn({ contractEndDate: tt.contractEndDate, pauses: tt.pauses }, tt.date)).toEqual(
        tt.expected,
      );
    });
  }
});

describe("splitByStatus", () => {
  const netflix = makeSubscription({ id: 1, name: "Netflix" });
  const spotify = makeSubscription({ id: 2, name: "Spotify", pauses: [spring] });
  const apple = makeSubscription({ id: 3, name: "Apple", pauses: [spring] });
  const gym = makeSubscription({ id: 4, name: "Gym", contractEndDate: "2026-03-09" });
  const items = [netflix, gym, spotify, apple];

  const tests: {
    name: string;
    date: string | null;
    running: string[];
    stopped: [string, SubscriptionStatus["kind"]][];
  }[] = [
    {
      name: "keeps everything running without a date",
      date: null,
      running: ["Netflix", "Gym", "Spotify", "Apple"],
      stopped: [],
    },
    {
      name: "keeps everything running before any pause or end",
      date: "2026-02-15",
      running: ["Netflix", "Gym", "Spotify", "Apple"],
      stopped: [],
    },
    {
      name: "moves paused and ended ones out, paused first, each by name",
      date: "2026-03-15",
      running: ["Netflix"],
      stopped: [
        ["Apple", "paused"],
        ["Spotify", "paused"],
        ["Gym", "ended"],
      ],
    },
    {
      name: "brings resumed ones back in input order",
      date: "2026-06-15",
      running: ["Netflix", "Spotify", "Apple"],
      stopped: [["Gym", "ended"]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = splitByStatus(items, tt.date);
      expect(result.running.map(({ name }) => name)).toEqual(tt.running);
      expect(result.stopped.map(({ item, status }) => [item.name, status.kind])).toEqual(tt.stopped);
    });
  }
});
