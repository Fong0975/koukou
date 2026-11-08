// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loggerMock } from "@/test/logger";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { notificationSetting: { findUnique: vi.fn(), upsert: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/logger", () => import("@/test/logger"));

import {
  getNotificationSetting,
  notificationSettingUpsert,
  readNotificationSetting,
  updateNotificationSetting,
} from "./notificationSettingService";

const saved = { enabled: true, monthlySummaryEnabled: false, sendTime: "08:30" };
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

beforeEach(() => vi.clearAllMocks());

describe("notificationSettingUpsert", () => {
  it("writes the single row with id 1", () => {
    expect(notificationSettingUpsert(saved)).toEqual({
      where: { id: 1 },
      create: { id: 1, ...saved },
      update: saved,
      select: { enabled: true, monthlySummaryEnabled: true, sendTime: true },
    });
  });
});

describe("readNotificationSetting", () => {
  const tests = [
    { name: "returns the stored row", row: saved, expected: saved },
    {
      name: "falls back to the defaults when never saved",
      row: null,
      expected: { enabled: false, monthlySummaryEnabled: true, sendTime: "09:00" },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.notificationSetting.findUnique.mockResolvedValue(tt.row);
      await expect(readNotificationSetting()).resolves.toEqual(tt.expected);
      expect(prismaMock.notificationSetting.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });
  }
});

describe("getNotificationSetting", () => {
  const tests = [
    { name: "adds the server time zone", row: saved, expected: { ...saved, timeZone } },
    {
      name: "adds the server time zone to the defaults",
      row: null,
      expected: { enabled: false, monthlySummaryEnabled: true, sendTime: "09:00", timeZone },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.notificationSetting.findUnique.mockResolvedValue(tt.row);
      await expect(getNotificationSetting()).resolves.toEqual(tt.expected);
    });
  }
});

describe("updateNotificationSetting", () => {
  const tests: { name: string; result: () => Promise<unknown>; error?: string }[] = [
    { name: "upserts and returns the settings with the time zone", result: () => Promise.resolve(saved) },
    { name: "propagates database errors", result: () => Promise.reject(new Error("db down")), error: "db down" },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.notificationSetting.upsert.mockImplementation(tt.result);
      const promise = updateNotificationSetting(saved);
      if (tt.error) {
        await expect(promise).rejects.toThrow(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toEqual({ ...saved, timeZone });
        expect(prismaMock.notificationSetting.upsert).toHaveBeenCalledWith(notificationSettingUpsert(saved));
        expect(loggerMock.info).toHaveBeenCalledWith("Notification settings updated", saved);
      }
    });
  }
});
