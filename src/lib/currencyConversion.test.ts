// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeOccurrence, makeSubscription } from "@/test/fixtures";
import type { ExchangeRateDto } from "@/types/dto";
import type { Reserve } from "./amortization";
import type { Occurrence } from "./billingOccurrences";
import {
  convertedReserveTwdCents,
  convertedTwdCents,
  needsExchangeRate,
  occurrenceTwdCents,
  rateOn,
  reserveTwdCents,
  sumTwdCents,
} from "./currencyConversion";

const rates: ExchangeRateDto[] = [
  { date: "2026-05-14", rate: 31.492 },
  { date: "2026-05-15", rate: 31.514 },
  { date: "2026-05-18", rate: 31.543 },
  { date: "2026-10-16", rate: 32.314 },
];

const netflix = makeSubscription({ id: 1, name: "Netflix", currency: "TWD", amount: "390.00" });
const spotify = makeSubscription({ id: 2, name: "Spotify", currency: "USD", amount: "15.49" });

const charge = (subscription: typeof netflix, date: string, amount = subscription.amount): Occurrence =>
  makeOccurrence(Number(date.slice(8)), subscription, { date, amount });

const reserve = (subscription: typeof netflix, chargeDate: string, reserveCents: number): Reserve => {
  const [year, month, day] = chargeDate.split("-").map(Number);
  return {
    key: `${subscription.id}`,
    subscription,
    chargeDate: { year, month, day },
    installment: 1,
    reserveCents,
    averageCents: reserveCents,
  };
};

describe("rateOn", () => {
  const tests = [
    { name: "rate published that day", rates, date: "2026-05-15", expected: 31.514 },
    { name: "unpublished day uses the previous rate", rates, date: "2026-05-17", expected: 31.514 },
    { name: "future day uses the latest rate", rates, date: "2026-12-31", expected: 32.314 },
    { name: "day before the first rate uses the first", rates, date: "2026-01-01", expected: 31.492 },
    { name: "first day", rates, date: "2026-05-14", expected: 31.492 },
    { name: "a single rate covers every day", rates: [rates[3]], date: "2027-06-01", expected: 32.314 },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(rateOn(tt.rates, tt.date)).toBe(tt.expected);
    });
  }
});

describe("occurrenceTwdCents", () => {
  const tests = [
    { name: "TWD keeps its exact amount", occurrence: charge(netflix, "2026-05-15", "99.50"), expected: 9950 },
    // 15.49 × 31.514 = 488.15 → 488.
    { name: "USD uses the charge day's rate", occurrence: charge(spotify, "2026-05-15"), expected: 48800 },
    // 15.49 × 32.314 = 500.54 → 501.
    { name: "future USD charge uses the latest rate", occurrence: charge(spotify, "2026-11-01"), expected: 50100 },
    // May 16 has no rate, so May 15's applies: 10.00 × 31.514 = 315.14 → 315.
    {
      name: "rounds to a whole dollar on an unpublished day",
      occurrence: charge(spotify, "2026-05-16", "10.00"),
      expected: 31500,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(occurrenceTwdCents(tt.occurrence, rates)).toBe(tt.expected);
    });
  }
});

describe("sumTwdCents", () => {
  const tests = [
    { name: "no charges", occurrences: [], expected: 0 },
    {
      name: "adds TWD as is and converts each USD charge with its own day's rate",
      occurrences: [charge(netflix, "2026-05-14"), charge(spotify, "2026-05-14"), charge(spotify, "2026-10-16")],
      // 390 + round(15.49 × 31.492 = 487.81) + round(15.49 × 32.314 = 500.54).
      expected: 39000 + 48800 + 50100,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(sumTwdCents(tt.occurrences, rates)).toBe(tt.expected);
    });
  }
});

describe("convertedTwdCents", () => {
  const occurrences = [charge(netflix, "2026-05-14"), charge(spotify, "2026-05-15")];

  const tests = [
    { name: "converts with rates", rates, expected: 39000 + 48800 },
    { name: "null without rates", rates: null, expected: null },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(convertedTwdCents(occurrences, tt.rates)).toBe(tt.expected);
    });
  }
});

describe("reserveTwdCents", () => {
  const tests = [
    { name: "TWD keeps its amount", reserve: reserve(netflix, "2026-10-11", 8400), expected: 8400 },
    // 9 × 31.514 = 283.63 → 284.
    { name: "USD uses the charge day's rate", reserve: reserve(spotify, "2026-05-15", 900), expected: 28400 },
    // 21 × 32.314 = 678.59 → 679.
    {
      name: "a charge beyond the rates uses the latest",
      reserve: reserve(spotify, "2027-03-01", 2100),
      expected: 67900,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(reserveTwdCents(tt.reserve, rates)).toBe(tt.expected);
    });
  }
});

describe("convertedReserveTwdCents", () => {
  const reserves = [reserve(netflix, "2026-10-11", 8400), reserve(spotify, "2027-03-01", 2100)];

  const tests = [
    { name: "no reserves", reserves: [], rates, expected: 0 },
    { name: "adds TWD as is and converts each USD reserve", reserves, rates, expected: 8400 + 67900 },
    { name: "null without rates", reserves, rates: null, expected: null },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(convertedReserveTwdCents(tt.reserves, tt.rates)).toBe(tt.expected);
    });
  }
});

describe("needsExchangeRate", () => {
  const tests = [
    { name: "no charges", items: [], expected: false },
    { name: "TWD only", items: [charge(netflix, "2026-05-14")], expected: false },
    {
      name: "any USD charge",
      items: [charge(netflix, "2026-05-14"), charge(spotify, "2026-05-15")],
      expected: true,
    },
    { name: "TWD reserves only", items: [reserve(netflix, "2026-10-11", 8400)], expected: false },
    { name: "any USD reserve", items: [reserve(spotify, "2027-03-01", 2100)], expected: true },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(needsExchangeRate(tt.items)).toBe(tt.expected);
    });
  }
});
