// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { DailyReminders, MonthlySummary } from "./dueReminders";
import { buildReminderMessage, buildTestMessage, MAX_MESSAGE_LENGTH } from "./messageText";

const netflix = makeSubscription({ id: 1, name: "Netflix" });
const telecom = makeSubscription({
  id: 2,
  name: "中華電信",
  amount: "599.00",
  paymentMethod: makePaymentMethod({ type: "BANK_ACCOUNT", name: "台新帳戶" }),
});

const summary: MonthlySummary = {
  month: { year: 2026, month: 11 },
  expiries: [{ day: 20, date: "2026-11-20", subscription: telecom }],
  reserve: { totals: { TWD: 10000 }, names: ["網域"] },
  charge: { totals: { TWD: 98900, USD: 2000 }, names: ["Netflix", "中華電信", "ChatGPT"] },
};

const empty: DailyReminders = { today: "2026-11-01", monthlySummary: null, charges: [], expiries: [] };

describe("buildReminderMessage", () => {
  const tests: { name: string; reminders: DailyReminders; expected: string | null }[] = [
    { name: "returns null when there is nothing to send", reminders: empty, expected: null },
    {
      name: "combines every section into one message",
      reminders: {
        ...empty,
        monthlySummary: summary,
        charges: [{ date: "2026-11-01", daysBefore: 0, subscription: netflix, amount: "390.00" }],
        expiries: [{ date: "2026-11-08", daysBefore: 7, subscription: telecom }],
      },
      expected: [
        "🔔 KouKou 提醒｜2026/11/01",
        "",
        "📅 11 月摘要",
        "・本月到期（1 項）",
        "  11/20（五） 中華電信",
        "・本月預扣：NT$ 100",
        "  網域",
        "・本月扣款：NT$ 989 / US$ 20.00",
        "  Netflix、中華電信、ChatGPT",
        "",
        "💳 扣款提醒",
        "・今天 11/1（日） Netflix NT$ 390",
        "  國泰 CUBE（信用卡）",
        "",
        "⏰ 合約到期",
        "・7 天後 11/8（日） 中華電信",
      ].join("\n"),
    },
    {
      name: "says a summary list is empty",
      reminders: {
        ...empty,
        monthlySummary: { ...summary, expiries: [], reserve: { totals: {}, names: [] } },
      },
      expected: [
        "🔔 KouKou 提醒｜2026/11/01",
        "",
        "📅 11 月摘要",
        "・本月到期：無",
        "・本月預扣：無",
        "・本月扣款：NT$ 989 / US$ 20.00",
        "  Netflix、中華電信、ChatGPT",
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
        "🔔 KouKou 提醒｜2026/11/07",
        "",
        "💳 扣款提醒",
        "・明天 11/8（日） 中華電信 NT$ 599",
        "  台新帳戶（帳戶扣款）",
        "",
        "⏰ 合約到期",
        "・今天 11/7（六） Netflix（今天是最後一天）",
      ].join("\n"),
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
    {
      name: "cuts long summary name lists",
      reminders: {
        ...empty,
        monthlySummary: {
          ...summary,
          reserve: { totals: { TWD: 100 }, names: names(150) },
          charge: { totals: { TWD: 100 }, names: names(150) },
        },
      },
      cutLists: 2,
      total: 300,
    },
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
