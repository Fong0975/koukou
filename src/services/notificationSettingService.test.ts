// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loggerMock } from "@/test/logger";
import type { NotificationSettingValuesDto } from "@/types/dto";

const { prismaMock, isLineConfigured, skipDayIfUntried } = vi.hoisted(() => ({
  prismaMock: { notificationSetting: { findUnique: vi.fn(), upsert: vi.fn() } },
  isLineConfigured: vi.fn(),
  skipDayIfUntried: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/logger", () => import("@/test/logger"));
vi.mock("./lineClient", () => ({ isLineConfigured }));
vi.mock("./notificationDispatchStore", () => ({ skipDayIfUntried }));

import {
  getNotificationSetting,
  notificationSettingUpsert,
  readNotificationSetting,
  updateNotificationSetting,
} from "./notificationSettingService";

const saved = { enabled: true, monthlySummaryEnabled: false, sendTime: "08:30" };
const defaults = { enabled: false, monthlySummaryEnabled: true, sendTime: "09:00" };
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

beforeEach(() => {
  vi.clearAllMocks();
  isLineConfigured.mockReturnValue(true);
  skipDayIfUntried.mockResolvedValue(undefined);
});

describe("notificationSettingUpsert", () => {
  const tests = [
    {
      name: "writes the single row with id 1",
      values: saved,
      expected: {
        where: { id: 1 },
        create: { id: 1, ...saved },
        update: saved,
        select: { enabled: true, monthlySummaryEnabled: true, sendTime: true },
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(notificationSettingUpsert(tt.values)).toEqual(tt.expected);
    });
  }
});

describe("readNotificationSetting", () => {
  const tests = [
    { name: "returns the stored row", row: saved, expected: saved },
    { name: "falls back to the defaults when never saved", row: null, expected: defaults },
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
    {
      name: "adds the time zone and LINE status",
      row: saved,
      lineConfigured: true,
      expected: { ...saved, timeZone, lineConfigured: true },
    },
    {
      name: "adds them to the defaults",
      row: null,
      lineConfigured: false,
      expected: { ...defaults, timeZone, lineConfigured: false },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.notificationSetting.findUnique.mockResolvedValue(tt.row);
      isLineConfigured.mockReturnValue(tt.lineConfigured);
      await expect(getNotificationSetting()).resolves.toEqual(tt.expected);
    });
  }
});

describe("updateNotificationSetting", () => {
  /** 2026-11-08 at the given local time. */
  const at = (hours: number, minutes: number) => new Date(2026, 10, 8, hours, minutes);
  const enable = { ...saved, enabled: true, sendTime: "09:00" };

  const tests: {
    name: string;
    previous: NotificationSettingValuesDto | null;
    data: NotificationSettingValuesDto;
    now: Date;
    result?: () => Promise<unknown>;
    skipsToday: boolean;
    error?: string;
  }[] = [
    {
      name: "starts tomorrow when switched on after the send time",
      previous: defaults,
      data: enable,
      now: at(9, 30),
      skipsToday: true,
    },
    {
      name: "starts tomorrow when first saved after the send time",
      previous: null,
      data: enable,
      now: at(21, 0),
      skipsToday: true,
    },
    {
      name: "starts today when switched on before the send time",
      previous: defaults,
      data: enable,
      now: at(8, 59),
      skipsToday: false,
    },
    {
      name: "leaves today alone when already on",
      previous: enable,
      data: { ...enable, sendTime: "08:00" },
      now: at(9, 30),
      skipsToday: false,
    },
    {
      name: "leaves today alone when switched off",
      previous: enable,
      data: { ...enable, enabled: false },
      now: at(9, 30),
      skipsToday: false,
    },
    {
      name: "propagates database errors",
      previous: defaults,
      data: enable,
      now: at(9, 30),
      result: () => Promise.reject(new Error("db down")),
      skipsToday: false,
      error: "db down",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.notificationSetting.findUnique.mockResolvedValue(tt.previous);
      prismaMock.notificationSetting.upsert.mockImplementation(tt.result ?? (() => Promise.resolve(tt.data)));

      const promise = updateNotificationSetting(tt.data, tt.now);

      if (tt.error) {
        await expect(promise).rejects.toThrow(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toEqual({ ...tt.data, timeZone, lineConfigured: true });
        expect(prismaMock.notificationSetting.upsert).toHaveBeenCalledWith(notificationSettingUpsert(tt.data));
        expect(loggerMock.info).toHaveBeenCalledWith("Notification settings updated", tt.data);
      }
      if (tt.skipsToday) expect(skipDayIfUntried).toHaveBeenCalledWith("2026-11-08");
      else expect(skipDayIfUntried).not.toHaveBeenCalled();
    });
  }
});
