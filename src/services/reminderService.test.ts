// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";
import { makeSubscription } from "@/test/fixtures";
import { loggerMock } from "@/test/logger";
import type { NotificationSettingValuesDto, SubscriptionDto } from "@/types/dto";
import type { Dispatch } from "./notificationDispatchStore";

const { mocks } = vi.hoisted(() => ({
  mocks: {
    pushText: vi.fn(),
    findDispatch: vi.fn(),
    saveDispatch: vi.fn(),
    readNotificationSetting: vi.fn(),
    listSubscriptions: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => import("@/test/logger"));
vi.mock("./lineClient", () => ({ pushText: mocks.pushText }));
vi.mock("./notificationDispatchStore", () => ({
  findDispatch: mocks.findDispatch,
  saveDispatch: mocks.saveDispatch,
}));
vi.mock("./notificationSettingService", () => ({ readNotificationSetting: mocks.readNotificationSetting }));
vi.mock("./subscriptionService", () => ({ listSubscriptions: mocks.listSubscriptions }));

import { runDailyReminder, sendTestMessage, type ReminderRunResult } from "./reminderService";

const setting: NotificationSettingValuesDto = { enabled: true, monthlySummaryEnabled: true, sendTime: "09:00" };

/** 2026-11-08 09:30 in the local time zone. */
const now = new Date(2026, 10, 8, 9, 30);

const dueToday = makeSubscription({
  schedules: [{ id: 10, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 8, month: null }],
  reminders: { chargeDaysBefore: [0], expiryDaysBefore: [] },
});
const quiet = makeSubscription({ id: 2, name: "Quiet" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.saveDispatch.mockResolvedValue(undefined);
});

describe("runDailyReminder", () => {
  const tests: {
    name: string;
    setting?: Partial<NotificationSettingValuesDto>;
    now?: Date;
    previous?: Dispatch | null;
    items?: SubscriptionDto[];
    push?: () => Promise<void>;
    expected: ReminderRunResult;
    /** What is recorded for the day, or undefined when nothing is. */
    saved?: [Dispatch, string?];
    pushed?: string;
  }[] = [
    { name: "does nothing when switched off", setting: { enabled: false }, expected: "disabled" },
    { name: "waits for the send time", setting: { sendTime: "10:00" }, expected: "not-due" },
    { name: "skips a day already sent", previous: { status: "SENT", attempts: 1 }, expected: "done" },
    { name: "skips a day with nothing to send", previous: { status: "SKIPPED", attempts: 0 }, expected: "done" },
    { name: "gives up after too many failures", previous: { status: "FAILED", attempts: 3 }, expected: "done" },
    {
      name: "records a day without reminders",
      items: [quiet],
      expected: "skipped",
      saved: [{ status: "SKIPPED", attempts: 0 }],
    },
    {
      name: "sends today's reminders",
      expected: "sent",
      saved: [{ status: "SENT", attempts: 1 }],
      pushed: "・Netflix NT$ 390",
    },
    {
      name: "catches up later the same day",
      now: new Date(2026, 10, 8, 22, 15),
      expected: "sent",
      saved: [{ status: "SENT", attempts: 1 }],
    },
    {
      name: "retries after a failure",
      previous: { status: "FAILED", attempts: 1 },
      expected: "sent",
      saved: [{ status: "SENT", attempts: 2 }],
    },
    {
      name: "records a failed send",
      push: () => Promise.reject(new UpstreamError("LINE 拒絕傳送訊息（HTTP 400）")),
      expected: "failed",
      saved: [{ status: "FAILED", attempts: 1 }, "LINE 拒絕傳送訊息（HTTP 400）"],
    },
    {
      name: "sends the monthly summary on the 1st",
      now: new Date(2026, 10, 1, 9, 0),
      items: [quiet],
      expected: "sent",
      saved: [{ status: "SENT", attempts: 1 }],
      pushed: "📅 11 月摘要",
    },
    {
      name: "leaves the summary out when switched off",
      setting: { monthlySummaryEnabled: false },
      now: new Date(2026, 10, 1, 9, 0),
      items: [quiet],
      expected: "skipped",
      saved: [{ status: "SKIPPED", attempts: 0 }],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      mocks.readNotificationSetting.mockResolvedValue({ ...setting, ...tt.setting });
      mocks.findDispatch.mockResolvedValue(tt.previous ?? null);
      mocks.listSubscriptions.mockResolvedValue(tt.items ?? [dueToday]);
      mocks.pushText.mockImplementation(tt.push ?? (() => Promise.resolve()));

      await expect(runDailyReminder(tt.now ?? now)).resolves.toBe(tt.expected);

      if (tt.saved) {
        const date = (tt.now ?? now).getDate() === 1 ? "2026-11-01" : "2026-11-08";
        expect(mocks.saveDispatch).toHaveBeenCalledWith(date, ...tt.saved);
      } else {
        expect(mocks.saveDispatch).not.toHaveBeenCalled();
      }
      const sent = ["sent", "failed"].includes(tt.expected);
      expect(mocks.pushText).toHaveBeenCalledTimes(sent ? 1 : 0);
      if (tt.pushed) expect(mocks.pushText.mock.calls[0][0]).toContain(tt.pushed);
      expect(loggerMock.error).toHaveBeenCalledTimes(tt.expected === "failed" ? 1 : 0);
    });
  }
});

describe("sendTestMessage", () => {
  const tests: { name: string; push: () => Promise<void>; error?: string }[] = [
    { name: "pushes a test message", push: () => Promise.resolve() },
    {
      name: "propagates a failed push",
      push: () => Promise.reject(new UpstreamError("尚未設定 LINE")),
      error: "尚未設定 LINE",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      mocks.pushText.mockImplementation(tt.push);
      const promise = sendTestMessage(now);
      if (tt.error) await expect(promise).rejects.toThrow(tt.error);
      else await expect(promise).resolves.toBeUndefined();
      expect(mocks.pushText).toHaveBeenCalledWith(expect.stringContaining("KouKou 測試訊息"));
      expect(mocks.pushText).toHaveBeenCalledWith(expect.stringContaining("2026/11/08 09:30"));
    });
  }
});
