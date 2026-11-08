// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loggerMock } from "@/test/logger";
import type { ReminderRunResult } from "./reminderService";

vi.mock("@/lib/logger", () => import("@/test/logger"));
vi.mock("./reminderService", () => ({ runDailyReminder: vi.fn() }));

import { CHECK_INTERVAL_MS, startReminderScheduler, stopReminderScheduler } from "./reminderScheduler";

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  stopReminderScheduler();
  vi.useRealTimers();
});

const resolved = () => Promise.resolve<ReminderRunResult>("sent");

describe("startReminderScheduler", () => {
  const tests: {
    name: string;
    run: () => Promise<ReminderRunResult>;
    starts?: number;
    intervals: number;
    expectedRuns: number;
    expectedErrors?: number;
    stopFirst?: boolean;
  }[] = [
    { name: "checks right away", run: resolved, intervals: 0, expectedRuns: 1 },
    { name: "checks again every interval", run: resolved, intervals: 3, expectedRuns: 4 },
    { name: "starts only once", run: resolved, starts: 2, intervals: 1, expectedRuns: 2 },
    {
      name: "never overlaps a slow check",
      run: () => new Promise<ReminderRunResult>(() => {}),
      intervals: 3,
      expectedRuns: 1,
    },
    {
      name: "logs a failed check and keeps going",
      run: () => Promise.reject(new Error("db down")),
      intervals: 1,
      expectedRuns: 2,
      expectedErrors: 2,
    },
    { name: "stops checking once stopped", run: resolved, intervals: 3, expectedRuns: 1, stopFirst: true },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const run = vi.fn(tt.run);
      const started = Array.from({ length: tt.starts ?? 1 }, () => startReminderScheduler(run));
      await vi.advanceTimersByTimeAsync(0);
      if (tt.stopFirst) stopReminderScheduler();
      await vi.advanceTimersByTimeAsync(CHECK_INTERVAL_MS * tt.intervals);

      expect(started).toEqual([true, ...Array<boolean>((tt.starts ?? 1) - 1).fill(false)]);
      expect(run).toHaveBeenCalledTimes(tt.expectedRuns);
      expect(run).toHaveBeenCalledWith(expect.any(Date));
      expect(loggerMock.error).toHaveBeenCalledTimes(tt.expectedErrors ?? 0);
    });
  }
});
