// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Currency } from "@/generated/prisma/enums";
import { makeCategory, makeOccurrence, makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import {
  chargesBySubscription,
  currencyEntries,
  sumByCurrency,
  toCents,
  totalByCurrency,
  totalsByCategory,
  totalsByPaymentMethod,
  totalsByPaymentType,
  type CurrencyTotals,
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

const occ = (day: number, subscription: SubscriptionDto, scheduleId = subscription.id * 10, amount?: string) =>
  makeOccurrence(day, subscription, { scheduleId, amount: amount ?? subscription.amount });

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

describe("totalByCurrency", () => {
  const tests: { name: string; entries: [Currency, number][]; expected: CurrencyTotals }[] = [
    { name: "no entries", entries: [], expected: {} },
    {
      name: "adds the same currency",
      entries: [
        ["TWD", 8400],
        ["TWD", 10000],
      ],
      expected: { TWD: 18400 },
    },
    {
      name: "keeps currencies apart",
      entries: [
        ["TWD", 8400],
        ["USD", 900],
      ],
      expected: { TWD: 8400, USD: 900 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(totalByCurrency(tt.entries)).toEqual(tt.expected);
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
    {
      name: "uses each charge's own amount",
      occurrences: [occ(1, netflix, 10, "330.00"), occ(15, netflix, 11)],
      expected: { TWD: 72000 },
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
        { name: "Netflix", days: [1, 15], count: 2, totalCents: 78000, unitCents: 39000, scheduleIds: [10, 11] },
        { name: "Spotify", days: [1], count: 1, totalCents: 1549, unitCents: 1549, scheduleIds: [20] },
      ],
    },
    {
      name: "orders by first charge day",
      occurrences: [occ(20, netflix), occ(3, gym)],
      expected: [
        { name: "健身房", days: [3], count: 1, totalCents: 99950, unitCents: 99950, scheduleIds: [30] },
        { name: "Netflix", days: [20], count: 1, totalCents: 39000, unitCents: 39000, scheduleIds: [10] },
      ],
    },
    {
      name: "two schedules on the same day count twice but list the day once",
      occurrences: [occ(1, netflix, 10), occ(1, netflix, 11), occ(2, netflix, 10)],
      expected: [
        { name: "Netflix", days: [1, 2], count: 3, totalCents: 117000, unitCents: 39000, scheduleIds: [10, 11, 10] },
      ],
    },
    {
      name: "an amount change mid-month leaves no single unit amount",
      occurrences: [occ(1, netflix, 10, "330.00"), occ(15, netflix, 11)],
      expected: [
        { name: "Netflix", days: [1, 15], count: 2, totalCents: 72000, unitCents: null, scheduleIds: [10, 11] },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = chargesBySubscription(tt.occurrences).map(
        ({ subscription, days, count, totalCents, unitCents, occurrences }) => ({
          name: subscription.name,
          days,
          count,
          totalCents,
          unitCents,
          scheduleIds: occurrences.map((o) => o.scheduleId),
        }),
      );

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
        { key: 1, label: "音樂", icon: "🎵", totals: { USD: 3098 }, days: [1, 8] },
        { key: 2, label: "影音串流", icon: "🎬", totals: { TWD: 138950 }, days: [1, 5] },
      ],
    },
    {
      name: "per payment method, labelled with its name",
      group: totalsByPaymentMethod,
      expected: [
        { key: 3, label: "國泰 CUBE", icon: null, totals: { TWD: 138950 }, days: [1, 5] },
        { key: 4, label: "台新 Richart", icon: null, totals: { USD: 3098 }, days: [1, 8] },
      ],
    },
    {
      name: "payment methods sort by type, then name, regardless of creation order",
      group: totalsByPaymentMethod,
      occurrences: [
        occ(1, makeSubscription({ id: 5, paymentMethod: makePaymentMethod({ id: 1, type: "OTHER", name: "Cash" }) })),
        occ(2, makeSubscription({ id: 6, paymentMethod: makePaymentMethod({ id: 2, name: "CUBE" }) })),
        occ(3, makeSubscription({ id: 7, paymentMethod: makePaymentMethod({ id: 3, name: "Amex" }) })),
      ],
      expected: [
        { key: 3, label: "Amex", icon: null, totals: { TWD: 39000 }, days: [3] },
        { key: 2, label: "CUBE", icon: null, totals: { TWD: 39000 }, days: [2] },
        { key: 1, label: "Cash", icon: null, totals: { TWD: 39000 }, days: [1] },
      ],
    },
    { name: "no charges gives no groups", group: totalsByCategory, occurrences: [], expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = tt
        .group(tt.occurrences ?? occurrences)
        .map(({ occurrences: grouped, ...group }) => ({ ...group, days: grouped.map((o) => o.day) }));

      expect(result).toEqual(tt.expected);
    });
  }
});

describe("totalsByPaymentType", () => {
  const cash = makePaymentMethod({ id: 1, type: "OTHER", name: "Cash" });
  const cube = makePaymentMethod({ id: 2, name: "CUBE" });
  const amex = makePaymentMethod({ id: 3, name: "Amex" });

  const tests = [
    { name: "no charges gives no sections", occurrences: [], expected: [] },
    {
      name: "sections by payment type in display order, each listing its methods by name",
      occurrences: [
        occ(1, makeSubscription({ id: 5, paymentMethod: cash })),
        occ(2, makeSubscription({ id: 6, paymentMethod: cube })),
        occ(3, makeSubscription({ id: 7, paymentMethod: amex, currency: "USD", amount: "15.49" })),
        occ(4, makeSubscription({ id: 8, paymentMethod: cube })),
      ],
      expected: [
        {
          type: "CREDIT_CARD",
          label: "信用卡",
          groups: [
            { key: 3, label: "Amex", totals: { USD: 1549 }, days: [3] },
            { key: 2, label: "CUBE", totals: { TWD: 78000 }, days: [2, 4] },
          ],
        },
        { type: "OTHER", label: "其他", groups: [{ key: 1, label: "Cash", totals: { TWD: 39000 }, days: [1] }] },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = totalsByPaymentType(tt.occurrences).map(({ groups, ...section }) => ({
        ...section,
        groups: groups.map(({ key, label, totals, occurrences }) => ({
          key,
          label,
          totals,
          days: occurrences.map((o) => o.day),
        })),
      }));

      expect(result).toEqual(tt.expected);
    });
  }
});
