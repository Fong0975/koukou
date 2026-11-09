// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";
import { makeSubscription } from "@/test/fixtures";
import { loggerMock } from "@/test/logger";
import type { NotificationSettingValuesDto, SubscriptionDto } from "@/types/dto";
import type { Dispatch } from "./notificationDispatchStore";

const { mocks } = vi.hoisted(() => ({
  mocks: {
    pushMessage: vi.fn(),
    findDispatch: vi.fn(),
    saveDispatch: vi.fn(),
    readNotificationSetting: vi.fn(),
    listSubscriptions: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => import("@/test/logger"));
vi.mock("./lineClient", () => ({ pushMessage: mocks.pushMessage }));
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

/** The 1st of the month, when the monthly summary is due. */
const firstOfMonth = new Date(2026, 10, 1, 9, 0);

const monthlyOn = (dayOfMonth: number) => [
  { id: 10, cycle: "MONTHLY" as const, dayOfWeek: null, dayOfMonth, month: null },
];
const chargeToday = { chargeDaysBefore: [0], expiryDaysBefore: [] };

const dueToday = makeSubscription({ schedules: monthlyOn(8), reminders: chargeToday });
const dueFirst = makeSubscription({ schedules: monthlyOn(1), reminders: chargeToday });
const quiet = makeSubscription({ id: 2, name: "Quiet" });

const SUMMARY_TEXT = "📅 11 月摘要";
const REMINDER_TEXT = "扣款提醒";
const REJECTION = "LINE 拒絕傳送訊息（HTTP 400）";
/** Everything a sent message shows, whether it is text or a card. */
const textOf = (message: unknown) => JSON.stringify(message);
const rejectSummary = (message: unknown) =>
  textOf(message).includes(SUMMARY_TEXT) ? Promise.reject(new UpstreamError(REJECTION)) : Promise.resolve();

beforeEach(() => {
  vi.clearAllMocks();
  mocks.saveDispatch.mockResolvedValue(undefined);
});

describe("runDailyReminder", () => {
  const tests: {
    name: string;
    setting?: Partial<NotificationSettingValuesDto>;
    now?: Date;
    /** The day the run handles, "YYYY-MM-DD"; defaults to the 8th. */
    date?: string;
    previous?: { SUMMARY?: Dispatch; DAILY?: Dispatch };
    items?: SubscriptionDto[];
    push?: (message: unknown) => Promise<void>;
    expected: ReminderRunResult;
    /** What is recorded for the day, in order. */
    saved?: [kind: string, dispatch: Dispatch, error?: string][];
    /** What each sent message holds and must not hold, in order. */
    pushed?: { has: string; lacks?: string }[];
    /** Whether the summary's earlier outcome is looked up. */
    looksUpSummary?: boolean;
  }[] = [
    { name: "does nothing when switched off", setting: { enabled: false }, expected: "disabled" },
    { name: "waits for the send time", setting: { sendTime: "10:00" }, expected: "not-due" },
    { name: "skips a day already sent", previous: { DAILY: { status: "SENT", attempts: 1 } }, expected: "done" },
    {
      name: "skips a day with nothing to send",
      previous: { DAILY: { status: "SKIPPED", attempts: 0 } },
      expected: "done",
    },
    {
      name: "gives up after too many failures",
      previous: { DAILY: { status: "FAILED", attempts: 3 } },
      expected: "done",
    },
    {
      name: "records a day without reminders",
      items: [quiet],
      expected: "skipped",
      saved: [["DAILY", { status: "SKIPPED", attempts: 0 }]],
    },
    {
      name: "sends today's reminders",
      expected: "sent",
      saved: [["DAILY", { status: "SENT", attempts: 1 }]],
      pushed: [{ has: "NT$ 390", lacks: "月摘要" }],
    },
    {
      name: "catches up later the same day",
      now: new Date(2026, 10, 8, 22, 15),
      expected: "sent",
      saved: [["DAILY", { status: "SENT", attempts: 1 }]],
      pushed: [{ has: REMINDER_TEXT }],
    },
    {
      name: "retries after a failure",
      previous: { DAILY: { status: "FAILED", attempts: 1 } },
      expected: "sent",
      saved: [["DAILY", { status: "SENT", attempts: 2 }]],
      pushed: [{ has: REMINDER_TEXT }],
    },
    {
      name: "records a failed send",
      push: () => Promise.reject(new UpstreamError(REJECTION)),
      expected: "failed",
      saved: [["DAILY", { status: "FAILED", attempts: 1 }, REJECTION]],
      pushed: [{ has: REMINDER_TEXT }],
    },
    {
      name: "sends the monthly summary before the day's reminders on the 1st",
      now: firstOfMonth,
      date: "2026-11-01",
      items: [dueFirst],
      expected: "sent",
      saved: [
        ["SUMMARY", { status: "SENT", attempts: 1 }],
        ["DAILY", { status: "SENT", attempts: 1 }],
      ],
      pushed: [
        { has: SUMMARY_TEXT, lacks: REMINDER_TEXT },
        { has: REMINDER_TEXT, lacks: "月摘要" },
      ],
      looksUpSummary: true,
    },
    {
      name: "sends only the summary on the 1st when no reminder is due",
      now: firstOfMonth,
      date: "2026-11-01",
      items: [quiet],
      expected: "sent",
      saved: [
        ["SUMMARY", { status: "SENT", attempts: 1 }],
        ["DAILY", { status: "SKIPPED", attempts: 0 }],
      ],
      pushed: [{ has: SUMMARY_TEXT }],
      looksUpSummary: true,
    },
    {
      name: "still sends the reminders when the summary fails",
      now: firstOfMonth,
      date: "2026-11-01",
      items: [dueFirst],
      push: rejectSummary,
      expected: "failed",
      saved: [
        ["SUMMARY", { status: "FAILED", attempts: 1 }, REJECTION],
        ["DAILY", { status: "SENT", attempts: 1 }],
      ],
      pushed: [{ has: SUMMARY_TEXT }, { has: REMINDER_TEXT }],
      looksUpSummary: true,
    },
    {
      name: "retries a failed summary without repeating the reminders",
      now: firstOfMonth,
      date: "2026-11-01",
      items: [dueFirst],
      previous: { SUMMARY: { status: "FAILED", attempts: 1 }, DAILY: { status: "SENT", attempts: 1 } },
      expected: "sent",
      saved: [["SUMMARY", { status: "SENT", attempts: 2 }]],
      pushed: [{ has: SUMMARY_TEXT, lacks: REMINDER_TEXT }],
      looksUpSummary: true,
    },
    {
      name: "retries failed reminders without repeating the summary",
      now: firstOfMonth,
      date: "2026-11-01",
      items: [dueFirst],
      previous: { SUMMARY: { status: "SENT", attempts: 1 }, DAILY: { status: "FAILED", attempts: 1 } },
      expected: "sent",
      saved: [["DAILY", { status: "SENT", attempts: 2 }]],
      pushed: [{ has: REMINDER_TEXT, lacks: "月摘要" }],
      looksUpSummary: true,
    },
    {
      name: "is done on the 1st once both messages are handled",
      now: firstOfMonth,
      date: "2026-11-01",
      previous: { SUMMARY: { status: "SENT", attempts: 1 }, DAILY: { status: "SKIPPED", attempts: 0 } },
      expected: "done",
      looksUpSummary: true,
    },
    {
      name: "still sends the summary on the 1st when there is nothing to report",
      now: firstOfMonth,
      date: "2026-11-01",
      items: [],
      expected: "sent",
      saved: [
        ["SUMMARY", { status: "SENT", attempts: 1 }],
        ["DAILY", { status: "SKIPPED", attempts: 0 }],
      ],
      pushed: [{ has: "NT$ 0" }],
      looksUpSummary: true,
    },
    {
      name: "leaves the summary out when switched off",
      setting: { monthlySummaryEnabled: false },
      now: firstOfMonth,
      date: "2026-11-01",
      items: [quiet],
      expected: "skipped",
      saved: [["DAILY", { status: "SKIPPED", attempts: 0 }]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      mocks.readNotificationSetting.mockResolvedValue({ ...setting, ...tt.setting });
      mocks.findDispatch.mockImplementation((_date: string, kind: "SUMMARY" | "DAILY") =>
        Promise.resolve(tt.previous?.[kind] ?? null),
      );
      mocks.listSubscriptions.mockResolvedValue(tt.items ?? [dueToday]);
      mocks.pushMessage.mockImplementation(tt.push ?? (() => Promise.resolve()));

      await expect(runDailyReminder(tt.now ?? now)).resolves.toBe(tt.expected);

      const date = tt.date ?? "2026-11-08";
      const saved = tt.saved ?? [];
      expect(mocks.saveDispatch.mock.calls).toEqual(
        saved.map(([kind, dispatch, error]) => (error ? [date, kind, dispatch, error] : [date, kind, dispatch])),
      );

      const pushed = tt.pushed ?? [];
      expect(mocks.pushMessage).toHaveBeenCalledTimes(pushed.length);
      pushed.forEach(({ has, lacks }, index) => {
        const text = textOf(mocks.pushMessage.mock.calls[index][0]);
        expect(text).toContain(has);
        if (lacks) expect(text).not.toContain(lacks);
      });

      const summaryLookups = mocks.findDispatch.mock.calls.filter(([, kind]) => kind === "SUMMARY").length;
      expect(summaryLookups).toBe(tt.looksUpSummary && tt.setting?.monthlySummaryEnabled !== false ? 1 : 0);
      expect(loggerMock.error).toHaveBeenCalledTimes(saved.filter(([, { status }]) => status === "FAILED").length);
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
      mocks.pushMessage.mockImplementation(tt.push);
      const promise = sendTestMessage(now);
      if (tt.error) await expect(promise).rejects.toThrow(tt.error);
      else await expect(promise).resolves.toBeUndefined();
      expect(mocks.pushMessage).toHaveBeenCalledWith({
        type: "text",
        text: expect.stringContaining("KouKou 測試訊息"),
      });
      expect(mocks.pushMessage).toHaveBeenCalledWith({
        type: "text",
        text: expect.stringContaining("2026/11/08 09:30"),
      });
    });
  }
});
