// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { MonthlySummary } from "./dueReminders";
import { MAX_MESSAGE_LENGTH } from "./messageLayout";
import { buildSummaryMessage } from "./summaryMessage";

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

describe("buildSummaryMessage", () => {
  const tests: { name: string; summary: MonthlySummary | null; expected: string | null }[] = [
    { name: "returns null when there is no summary", summary: null, expected: null },
    {
      name: "lists expiries, reserves and charges",
      summary,
      expected: [
        "📅 11 月摘要",
        "・本月到期 (1 項)",
        "  11/20 (五) 中華電信",
        "",
        "・本月預扣：NT$ 100",
        "  網域",
        "",
        "・本月扣款：NT$ 989 + US$ 20.00",
        "  Netflix、中華電信、ChatGPT",
      ].join("\n"),
    },
    {
      name: "says a summary list is empty",
      summary: { ...summary, expiries: [], reserve: { totals: {}, names: [] } },
      expected: [
        "📅 11 月摘要",
        "・本月到期：無",
        "",
        "・本月預扣：無",
        "",
        "・本月扣款：NT$ 989 + US$ 20.00",
        "  Netflix、中華電信、ChatGPT",
      ].join("\n"),
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(buildSummaryMessage(tt.summary)).toBe(tt.expected);
    });
  }
});

describe("buildSummaryMessage length limit", () => {
  const MARK = "很長的訂閱項目名稱";
  const names = (count: number) => Array.from({ length: count }, (_, index) => `${MARK}${index}`.padEnd(60, "＊"));
  const countShown = (message: string) => message.split(MARK).length - 1;

  const tests: { name: string; summary: MonthlySummary; cutLists: number; total: number }[] = [
    {
      name: "cuts long name lists",
      summary: {
        ...summary,
        reserve: { totals: { TWD: 100 }, names: names(150) },
        charge: { totals: { TWD: 100 }, names: names(150) },
      },
      cutLists: 2,
      total: 300,
    },
    {
      name: "keeps a message that fits whole",
      summary: { ...summary, reserve: { totals: { TWD: 100 }, names: names(5) }, charge: { totals: {}, names: [] } },
      cutLists: 0,
      total: 5,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const message = buildSummaryMessage(tt.summary)!;
      const hidden = [...message.matchAll(/…另 (\d+) 項/g)].map((match) => Number(match[1]));

      expect(message.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
      expect(hidden).toHaveLength(tt.cutLists);
      expect(countShown(message) + hidden.reduce((sum, count) => sum + count, 0)).toBe(tt.total);
    });
  }
});
