// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeCategory, makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import type { Occurrence } from "./billingOccurrences";
import {
  chargesBySubscription,
  currencyEntries,
  sumByCurrency,
  toCents,
  totalsByCategory,
  totalsByPaymentMethod,
  yearTotals,
} from "./billingSummary";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({
  id: 2,
  name: "Spotify",
  currency: "USD",
  amount: "15.49",
  category: makeCategory({ id: 1, name: "音樂", icon: "🎵", sortOrder: 10 }),
  paymentMethod: makePaymentMethod({ id: 4, type: "BANK_ACCOUNT", name: "台新 Richart" }),
});
const gym = makeSubscription({ id: 3, name: "健身房", currency: "TWD", amount: "999.50" });

const occ = (day: number, subscription: SubscriptionDto, scheduleId = subscription.id * 10): Occurrence => ({
  day,
  subscription,
  scheduleId,
});

describe("toCents", () => {
  const tests = [
    { name: "whole amount", amount: "1290.00", expected: 129000 },
    { name: "cents", amount: "15.49", expected: 1549 },
    { name: "rounds away floating-point error", amount: "0.29", expected: 29 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toCents(tt.amount)).toBe(tt.expected);
    });
  }
});

describe("currencyEntries", () => {
  const tests = [
    { name: "empty", totals: {}, expected: [] },
    {
      name: "TWD comes before USD",
      totals: { USD: 1549, TWD: 39000 },
      expected: [
        ["TWD", 39000],
        ["USD", 1549],
      ],
    },
    { name: "keeps a zero total", totals: { TWD: 0 }, expected: [["TWD", 0]] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(currencyEntries(tt.totals)).toEqual(tt.expected);
    });
  }
});

describe("sumByCurrency", () => {
  const tests = [
    { name: "no charges", occurrences: [], expected: {} },
    {
      name: "repeated cents add up exactly",
      occurrences: [occ(1, spotify), occ(8, spotify), occ(15, spotify)],
      expected: { USD: 4647 },
    },
    {
      name: "keeps currencies apart",
      occurrences: [occ(1, netflix), occ(1, spotify), occ(5, gym)],
      expected: { TWD: 138950, USD: 1549 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(sumByCurrency(tt.occurrences)).toEqual(tt.expected);
    });
  }
});

describe("chargesBySubscription", () => {
  const tests = [
    { name: "no charges", occurrences: [], expected: [] },
    {
      name: "one row per subscription; same first day sorts by name",
      occurrences: [occ(1, spotify), occ(1, netflix, 10), occ(15, netflix, 11)],
      expected: [
        { name: "Netflix", days: [1, 15], count: 2, totalCents: 78000 },
        { name: "Spotify", days: [1], count: 1, totalCents: 1549 },
      ],
    },
    {
      name: "orders by first charge day",
      occurrences: [occ(20, netflix), occ(3, gym)],
      expected: [
        { name: "健身房", days: [3], count: 1, totalCents: 99950 },
        { name: "Netflix", days: [20], count: 1, totalCents: 39000 },
      ],
    },
    {
      name: "two schedules on the same day count twice but list the day once",
      occurrences: [occ(1, netflix, 10), occ(1, netflix, 11), occ(2, netflix, 10)],
      expected: [{ name: "Netflix", days: [1, 2], count: 3, totalCents: 117000 }],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = chargesBySubscription(tt.occurrences).map(({ subscription, days, count, totalCents }) => ({
        name: subscription.name,
        days,
        count,
        totalCents,
      }));

      expect(result).toEqual(tt.expected);
    });
  }
});

describe("totalsByCategory / totalsByPaymentMethod", () => {
  const occurrences = [occ(1, netflix), occ(1, spotify), occ(5, gym), occ(8, spotify)];

  const tests = [
    {
      name: "per category, in configured order",
      group: totalsByCategory,
      expected: [
        { key: 1, label: "音樂", icon: "🎵", totals: { USD: 3098 } },
        { key: 2, label: "影音串流", icon: "🎬", totals: { TWD: 138950 } },
      ],
    },
    {
      name: "per payment method, labelled with its type",
      group: totalsByPaymentMethod,
      expected: [
        { key: 3, label: "信用卡・國泰 CUBE", icon: null, totals: { TWD: 138950 } },
        { key: 4, label: "帳戶扣款・台新 Richart", icon: null, totals: { USD: 3098 } },
      ],
    },
    { name: "no charges gives no groups", group: totalsByCategory, occurrences: [], expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(tt.group(tt.occurrences ?? occurrences)).toEqual(tt.expected);
    });
  }
});

describe("yearTotals", () => {
  const leapDayDomain = makeSubscription({
    id: 4,
    name: "Domain",
    currency: "USD",
    amount: "10.00",
    schedules: [{ id: 40, cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 29, month: 2 }],
  });

  const tests = [
    { name: "no subscriptions", items: [], year: 2026, expected: {} },
    { name: "monthly charges twelve times", items: [netflix], year: 2026, expected: { TWD: 468000 } },
    {
      name: "Feb 29 still charges once in a common year",
      items: [netflix, leapDayDomain],
      year: 2026,
      expected: { TWD: 468000, USD: 1000 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(yearTotals(tt.items, tt.year)).toEqual(tt.expected);
    });
  }
});
