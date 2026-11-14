// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Currency } from "@/generated/prisma/enums";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import { currencyEntries, sumByCurrency, toCents, totalByCurrency, type CurrencyTotals } from "./money";

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49" });
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
