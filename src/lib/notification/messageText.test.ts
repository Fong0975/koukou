// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { DailyReminders } from "./dueReminders";
import { MAX_MESSAGE_LENGTH } from "./messageLayout";
import { buildReminderMessage, buildTestMessage } from "./messageText";

const netflix = makeSubscription({ id: 1, name: "Netflix" });
const telecom = makeSubscription({
  id: 2,
  name: "中華電信",
  amount: "599.00",
  paymentMethod: makePaymentMethod({ type: "BANK_ACCOUNT", name: "台新帳戶" }),
});

const empty: DailyReminders = { today: "2026-11-01", charges: [], expiries: [] };

describe("buildReminderMessage", () => {
  const tests: { name: string; reminders: DailyReminders; expected: string | null }[] = [
    { name: "returns null when there is nothing to send", reminders: empty, expected: null },
    {
      name: "combines charges and expiries into one message",
      reminders: {
        ...empty,
        charges: [{ date: "2026-11-01", daysBefore: 0, subscription: netflix, amount: "390.00" }],
        expiries: [{ date: "2026-11-08", daysBefore: 7, subscription: telecom }],
      },
      expected: [
        "🔔 扣款 1 筆・到期 1 項｜11/1 (日)",
        "",
        "💳 扣款提醒",
        "  ▸ 今天 11/1 (日)",
        "  ・Netflix NT$ 390",
        "    國泰 CUBE",
        "",
        "⏰ 合約到期",
        "・中華電信：7 天後 (11/8) 到期",
      ].join("\n"),
    },
    {
      name: "names tomorrow and the contract's last day",
      reminders: {
        ...empty,
        today: "2026-11-07",
        charges: [{ date: "2026-11-08", daysBefore: 1, subscription: telecom, amount: "599.00" }],
        expiries: [{ date: "2026-11-07", daysBefore: 0, subscription: netflix }],
      },
      expected: [
        "🔔 扣款 1 筆・到期 1 項｜11/7 (六)",
        "",
        "💳 扣款提醒",
        "  ▸ 明天 11/8 (日)",
        "  ・中華電信 NT$ 599",
        "    台新帳戶",
        "",
        "⏰ 合約到期",
        "・Netflix：今天到期",
      ].join("\n"),
    },
    {
      name: "groups charges by date with a blank line between dates",
      reminders: {
        ...empty,
        today: "2026-11-08",
        charges: [
          { date: "2026-11-08", daysBefore: 0, subscription: netflix, amount: "390.00" },
          { date: "2026-11-08", daysBefore: 0, subscription: telecom, amount: "599.00" },
          { date: "2026-11-11", daysBefore: 3, subscription: netflix, amount: "390.00" },
        ],
      },
      expected: [
        "🔔 扣款 3 筆｜11/8 (日)",
        "",
        "💳 扣款提醒",
        "  ▸ 今天 11/8 (日)",
        "  ・Netflix NT$ 390",
        "    國泰 CUBE",
        "  ・中華電信 NT$ 599",
        "    台新帳戶",
        "",
        "  ▸ 3 天後 11/11 (三)",
        "  ・Netflix NT$ 390",
        "    國泰 CUBE",
      ].join("\n"),
    },
    {
      name: "shows the date of a contract ending tomorrow",
      reminders: {
        ...empty,
        today: "2026-11-08",
        expiries: [{ date: "2026-11-09", daysBefore: 1, subscription: telecom }],
      },
      expected: ["🔔 到期 1 項｜11/8 (日)", "", "⏰ 合約到期", "・中華電信：明天 (11/9) 到期"].join("\n"),
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(buildReminderMessage(tt.reminders)).toBe(tt.expected);
    });
  }
});

describe("buildReminderMessage length limit", () => {
  const MARK = "很長的扣款項目名稱";
  const names = (count: number) => Array.from({ length: count }, (_, index) => `${MARK}${index}`.padEnd(60, "＊"));
  const charges = (count: number) =>
    names(count).map((name, index) => ({
      date: "2026-11-01",
      daysBefore: 0,
      subscription: makeSubscription({ id: index + 1, name }),
      amount: "1.00",
    }));
  /** Counts the long names a message shows, each at most once per line. */
  const countShown = (message: string) => message.split(MARK).length - 1;

  const tests: {
    name: string;
    reminders: DailyReminders;
    /** How many lists are cut. */
    cutLists: number;
    /** How many long names the reminders hold in all. */
    total: number;
  }[] = [
    { name: "cuts a long charge list", reminders: { ...empty, charges: charges(200) }, cutLists: 1, total: 200 },
    { name: "keeps a message that fits whole", reminders: { ...empty, charges: charges(10) }, cutLists: 0, total: 10 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const message = buildReminderMessage(tt.reminders)!;
      const hidden = [...message.matchAll(/…另 (\d+) 項/g)].map((match) => Number(match[1]));

      expect(message.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
      expect(hidden).toHaveLength(tt.cutLists);
      expect(countShown(message) + hidden.reduce((sum, count) => sum + count, 0)).toBe(tt.total);
    });
  }
});

describe("buildTestMessage", () => {
  const tests = [
    {
      name: "includes the send time",
      sentAt: "2026/11/08 09:00",
      expected: "✅ KouKou 測試訊息\nLINE 通知設定成功，提醒會傳送到這裡。\n傳送時間：2026/11/08 09:00",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(buildTestMessage(tt.sentAt)).toBe(tt.expected);
    });
  }
});
