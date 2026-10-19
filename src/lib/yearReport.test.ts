// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeCategory, makeOccurrence, makePaymentMethod, makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto, SubscriptionDto } from "@/types/dto";
import type { Occurrence } from "./billingOccurrences";
import { totalsByCategory } from "./billingSummary";
import {
  foldGroupShares,
  groupShares,
  monthlyTotals,
  OTHER_GROUP_KEY,
  reportTwdCents,
  shareOf,
  subscriptionRanking,
  yearHighlights,
  type GroupShare,
  type MonthTotal,
} from "./yearReport";

// 15.49 × 32 = 495.68 → NT$ 496.
const rates: ExchangeRateDto[] = [{ date: "2026-01-01", rate: 32 }];

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
const apple = makeSubscription({ id: 4, name: "Apple", currency: "TWD", amount: "390.00" });

const charge = (subscription: SubscriptionDto, date: string): Occurrence =>
  makeOccurrence(Number(date.slice(8)), subscription, { date });

/** Twelve monthly totals, empty except for the given months. */
const expectedMonths = (overrides: Record<number, Omit<MonthTotal, "month">>): MonthTotal[] =>
  Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    ...(overrides[index + 1] ?? { totals: {}, twdCents: 0 }),
  }));

describe("reportTwdCents", () => {
  const tests = [
    { name: "no charges", occurrences: [], rates: null, expected: 0 },
    {
      name: "TWD charges add up without rates",
      occurrences: [charge(netflix, "2026-01-01"), charge(gym, "2026-01-05")],
      rates: null,
      expected: 39000 + 99950,
    },
    { name: "foreign charges need rates", occurrences: [charge(spotify, "2026-01-05")], rates: null, expected: null },
    {
      name: "foreign charges are converted with rates",
      occurrences: [charge(netflix, "2026-01-01"), charge(spotify, "2026-01-05")],
      rates,
      expected: 39000 + 49600,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(reportTwdCents(tt.occurrences, tt.rates)).toBe(tt.expected);
    });
  }
});

describe("shareOf", () => {
  const tests = [
    { name: "fraction of the whole", part: 25, whole: 100, expected: 0.25 },
    { name: "unknown part", part: null, whole: 100, expected: 0 },
    { name: "unknown whole", part: 25, whole: null, expected: 0 },
    { name: "zero whole", part: 0, whole: 0, expected: 0 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(shareOf(tt.part, tt.whole)).toBe(tt.expected);
    });
  }
});

describe("monthlyTotals", () => {
  const occurrences = [charge(netflix, "2026-01-01"), charge(netflix, "2026-03-01"), charge(spotify, "2026-03-05")];

  const tests = [
    { name: "a year without charges", occurrences: [], rates: null, expected: expectedMonths({}) },
    {
      name: "adds each month up and converts it",
      occurrences,
      rates,
      expected: expectedMonths({
        1: { totals: { TWD: 39000 }, twdCents: 39000 },
        3: { totals: { TWD: 39000, USD: 1549 }, twdCents: 39000 + 49600 },
      }),
    },
    {
      name: "months with foreign charges have no TWD total without rates",
      occurrences,
      rates: null,
      expected: expectedMonths({
        1: { totals: { TWD: 39000 }, twdCents: 39000 },
        3: { totals: { TWD: 39000, USD: 1549 }, twdCents: null },
      }),
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(monthlyTotals(tt.occurrences, tt.rates)).toEqual(tt.expected);
    });
  }
});

describe("yearHighlights", () => {
  const year = [
    charge(netflix, "2026-01-01"),
    charge(netflix, "2026-03-01"),
    charge(spotify, "2026-03-05"),
    charge(gym, "2026-05-10"),
  ];

  const tests = [
    {
      name: "a year without charges",
      occurrences: [],
      rates: null,
      expected: {
        totals: {},
        twdCents: 0,
        monthlyAverageTwdCents: 0,
        chargeCount: 0,
        subscriptionCount: 0,
        highest: null,
        lowest: null,
      },
    },
    {
      // 390 + (390 + 496) + 999.50 = 2,275.50; ÷ 12 = 189.63 → 190.
      name: "sums the year and picks the most and least expensive charged months",
      occurrences: year,
      rates,
      expected: {
        totals: { TWD: 39000 * 2 + 99950, USD: 1549 },
        twdCents: 227550,
        monthlyAverageTwdCents: 19000,
        chargeCount: 4,
        subscriptionCount: 3,
        highest: 5,
        lowest: 1,
      },
    },
    {
      name: "TWD figures are unknown without rates",
      occurrences: year,
      rates: null,
      expected: {
        totals: { TWD: 39000 * 2 + 99950, USD: 1549 },
        twdCents: null,
        monthlyAverageTwdCents: null,
        chargeCount: 4,
        subscriptionCount: 3,
        highest: null,
        lowest: null,
      },
    },
    {
      name: "the earlier month wins a tie",
      occurrences: [charge(netflix, "2026-01-01"), charge(netflix, "2026-02-01")],
      rates: null,
      expected: {
        totals: { TWD: 78000 },
        twdCents: 78000,
        monthlyAverageTwdCents: 6500,
        chargeCount: 2,
        subscriptionCount: 1,
        highest: 1,
        lowest: 1,
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const highlights = yearHighlights(monthlyTotals(tt.occurrences, tt.rates), tt.occurrences);

      expect({
        ...highlights,
        highest: highlights.highest?.month ?? null,
        lowest: highlights.lowest?.month ?? null,
      }).toEqual(tt.expected);
    });
  }
});

describe("groupShares", () => {
  // 音樂: Spotify 496; 影音串流: Netflix 390 + 健身房 999.50.
  const occurrences = [charge(netflix, "2026-01-01"), charge(gym, "2026-01-05"), charge(spotify, "2026-01-05")];

  const tests = [
    { name: "no groups", occurrences: [], rates: null, expected: [] },
    {
      name: "converts each group and shares the whole",
      occurrences,
      rates,
      expected: [
        { label: "音樂", twdCents: 49600, share: 49600 / 188550 },
        { label: "影音串流", twdCents: 138950, share: 138950 / 188550 },
      ],
    },
    {
      name: "shares are 0 while a group cannot be converted",
      occurrences,
      rates: null,
      expected: [
        { label: "音樂", twdCents: null, share: 0 },
        { label: "影音串流", twdCents: 138950, share: 0 },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const shares = groupShares(totalsByCategory(tt.occurrences), tt.rates);

      expect(shares.map(({ label, twdCents, share }) => ({ label, twdCents, share }))).toEqual(tt.expected);
    });
  }
});

describe("foldGroupShares", () => {
  const group = (key: number, twdCents: number | null, share: number): GroupShare => ({
    key,
    label: `類別 ${key}`,
    icon: null,
    totals: { TWD: twdCents ?? 0 },
    twdCents,
    share,
  });
  const groups = [group(1, 100, 0.1), group(2, 500, 0.5), group(3, 50, 0.05), group(4, 350, 0.35)];

  const tests = [
    { name: "groups that fit are kept as they are", groups, slots: 4, expected: groups },
    {
      name: "the smallest groups merge into 其他, the rest keep their order",
      groups,
      slots: 3,
      expected: [
        group(2, 500, 0.5),
        group(4, 350, 0.35),
        { key: OTHER_GROUP_KEY, label: "其他", icon: null, totals: { TWD: 150 }, twdCents: 150, share: 0.1 + 0.05 },
      ],
    },
    {
      name: "其他 has no TWD total while a merged group cannot be converted",
      groups: [group(1, 100, 0), group(2, null, 0), group(3, 50, 0)],
      slots: 2,
      expected: [
        group(1, 100, 0),
        { key: OTHER_GROUP_KEY, label: "其他", icon: null, totals: { TWD: 50 }, twdCents: null, share: 0 },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(foldGroupShares(tt.groups, tt.slots)).toEqual(tt.expected);
    });
  }
});

describe("subscriptionRanking", () => {
  const occurrences = [
    charge(netflix, "2026-01-01"),
    charge(netflix, "2026-02-01"),
    charge(spotify, "2026-01-05"),
    charge(gym, "2026-01-10"),
  ];

  const tests = [
    { name: "no charges", occurrences: [], rates: null, expected: [] },
    {
      name: "most expensive first, relative to the top one",
      occurrences,
      rates,
      expected: [
        { name: "健身房", count: 1, totals: { TWD: 99950 }, twdCents: 99950, share: 1 },
        { name: "Netflix", count: 2, totals: { TWD: 78000 }, twdCents: 78000, share: 78000 / 99950 },
        { name: "Spotify", count: 1, totals: { USD: 1549 }, twdCents: 49600, share: 49600 / 99950 },
      ],
    },
    {
      name: "unconverted subscriptions come last",
      occurrences,
      rates: null,
      expected: [
        { name: "健身房", count: 1, totals: { TWD: 99950 }, twdCents: 99950, share: 1 },
        { name: "Netflix", count: 2, totals: { TWD: 78000 }, twdCents: 78000, share: 78000 / 99950 },
        { name: "Spotify", count: 1, totals: { USD: 1549 }, twdCents: null, share: 0 },
      ],
    },
    {
      name: "ties are ordered by name",
      occurrences: [charge(netflix, "2026-01-01"), charge(apple, "2026-01-02")],
      rates: null,
      expected: [
        { name: "Apple", count: 1, totals: { TWD: 39000 }, twdCents: 39000, share: 1 },
        { name: "Netflix", count: 1, totals: { TWD: 39000 }, twdCents: 39000, share: 1 },
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const ranking = subscriptionRanking(tt.occurrences, tt.rates);

      expect(
        ranking.map(({ subscription, count, totals, twdCents, share }) => ({
          name: subscription.name,
          count,
          totals,
          twdCents,
          share,
        })),
      ).toEqual(tt.expected);
    });
  }
});
