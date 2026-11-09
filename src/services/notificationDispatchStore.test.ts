// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { notificationDispatch: { findUnique: vi.fn(), upsert: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { findDispatch, saveDispatch, skipDayIfUntried } from "./notificationDispatchStore";

const day = new Date("2026-11-08T00:00:00.000Z");

beforeEach(() => vi.clearAllMocks());

describe("findDispatch", () => {
  const tests = [
    {
      name: "returns the day's outcome",
      kind: "DAILY",
      row: { status: "SENT", attempts: 1 },
      expected: { status: "SENT", attempts: 1 },
    },
    {
      name: "looks up the summary on its own",
      kind: "SUMMARY",
      row: { status: "FAILED", attempts: 2 },
      expected: { status: "FAILED", attempts: 2 },
    },
    { name: "returns null for a message not tried yet", kind: "DAILY", row: null, expected: null },
  ] as const;

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.notificationDispatch.findUnique.mockResolvedValue(tt.row);
      await expect(findDispatch("2026-11-08", tt.kind)).resolves.toEqual(tt.expected);
      expect(prismaMock.notificationDispatch.findUnique).toHaveBeenCalledWith({
        where: { date_kind: { date: day, kind: tt.kind } },
        select: { status: true, attempts: true },
      });
    });
  }
});

describe("skipDayIfUntried", () => {
  const tests = [{ name: "skips both messages without touching existing ones", date: "2026-11-08" }];

  for (const tt of tests) {
    it(tt.name, async () => {
      await skipDayIfUntried(tt.date);
      expect(prismaMock.notificationDispatch.upsert).toHaveBeenCalledTimes(2);
      for (const kind of ["SUMMARY", "DAILY"]) {
        expect(prismaMock.notificationDispatch.upsert).toHaveBeenCalledWith({
          where: { date_kind: { date: day, kind } },
          create: { date: day, kind, status: "SKIPPED", attempts: 0 },
          update: {},
        });
      }
    });
  }
});

describe("saveDispatch", () => {
  const tests: { name: string; lastError?: string | null; expectedError: string | null }[] = [
    { name: "records an outcome without an error", expectedError: null },
    { name: "keeps a short error", lastError: "LINE 拒絕傳送訊息", expectedError: "LINE 拒絕傳送訊息" },
    { name: "cuts a long error to the column length", lastError: "x".repeat(300), expectedError: "x".repeat(255) },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      await saveDispatch("2026-11-08", "SUMMARY", { status: "FAILED", attempts: 2 }, tt.lastError);
      const data = { status: "FAILED", attempts: 2, lastError: tt.expectedError };
      expect(prismaMock.notificationDispatch.upsert).toHaveBeenCalledWith({
        where: { date_kind: { date: day, kind: "SUMMARY" } },
        create: { date: day, kind: "SUMMARY", ...data },
        update: data,
      });
    });
  }
});
