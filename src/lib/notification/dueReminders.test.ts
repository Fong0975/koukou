// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { SubscriptionDto } from "@/types/dto";
import { buildMonthlySummary, collectDailyReminders, hasNoReminders, isFirstOfMonth } from "./dueReminders";

const monthlyOn = (dayOfMonth: number) => [
  { id: 10, cycle: "MONTHLY" as const, dayOfWeek: null, dayOfMonth, month: null },
];

const reminders = (chargeDaysBefore: number[], expiryDaysBefore: number[] = []) => ({
  chargeDaysBefore,
  expiryDaysBefore,
});

const charged = (overrides: Partial<SubscriptionDto>) =>
  makeSubscription({ schedules: monthlyOn(10), reminders: reminders([0, 2]), ...overrides });

describe("collectDailyReminders", () => {
  const tests: {
    name: string;
    items: SubscriptionDto[];
    today: string;
    charges?: { name: string; date: string; daysBefore: number; amount: string }[];
    expiries?: { name: string; date: string; daysBefore: number }[];
  }[] = [
    {
      name: "reminds of a charge days ahead",
      items: [charged({})],
      today: "2026-11-08",
      charges: [{ name: "Netflix", date: "2026-11-10", daysBefore: 2, amount: "390.00" }],
    },
    {
      name: "reminds of a charge on the day",
      items: [charged({})],
      today: "2026-11-10",
      charges: [{ name: "Netflix", date: "2026-11-10", daysBefore: 0, amount: "390.00" }],
    },
    { name: "ignores days without a reminder", items: [charged({})], today: "2026-11-09" },
    {
      name: "ignores subscriptions without reminders",
      items: [charged({ reminders: reminders([]) })],
      today: "2026-11-10",
    },
    {
      name: "moves a missing day of month to the month's last day",
      items: [charged({ schedules: monthlyOn(31), reminders: reminders([0]) })],
      today: "2026-11-30",
      charges: [{ name: "Netflix", date: "2026-11-30", daysBefore: 0, amount: "390.00" }],
    },
    {
      name: "reaches into the next month",
      items: [charged({ schedules: monthlyOn(1), reminders: reminders([2]) })],
      today: "2026-11-29",
      charges: [{ name: "Netflix", date: "2026-12-01", daysBefore: 2, amount: "390.00" }],
    },
    {
      name: "skips a charge before the start date",
      items: [charged({ startDate: "2026-11-11" })],
      today: "2026-11-08",
    },
    {
      name: "skips a charge after the contract end date",
      items: [charged({ contractEndDate: "2026-11-09" })],
      today: "2026-11-08",
    },
    {
      name: "skips a charge during a pause",
      items: [charged({ pauses: [{ id: 1, startDate: "2026-11-01", endDate: "2026-11-30" }] })],
      today: "2026-11-08",
    },
    {
      name: "skips a charge once cancelled",
      items: [charged({ pauses: [{ id: 1, startDate: "2026-11-09", endDate: null }] })],
      today: "2026-11-08",
    },
    {
      name: "uses the amount that applies on the charge day",
      items: [charged({ amountPeriods: [{ id: 1, amount: "330.00", endDate: "2026-11-30" }] })],
      today: "2026-11-10",
      charges: [{ name: "Netflix", date: "2026-11-10", daysBefore: 0, amount: "330.00" }],
    },
    {
      name: "skips a zero-amount charge, e.g. during a free trial",
      items: [charged({ amountPeriods: [{ id: 1, amount: "0.00", endDate: "2026-11-30" }] })],
      today: "2026-11-10",
    },
    {
      name: "orders charges by date, then name",
      items: [
        charged({ id: 1, name: "Spotify", schedules: monthlyOn(10) }),
        charged({ id: 2, name: "Netflix", schedules: monthlyOn(12) }),
        charged({ id: 3, name: "Apple", schedules: monthlyOn(10) }),
      ],
      today: "2026-11-10",
      charges: [
        { name: "Apple", date: "2026-11-10", daysBefore: 0, amount: "390.00" },
        { name: "Spotify", date: "2026-11-10", daysBefore: 0, amount: "390.00" },
        { name: "Netflix", date: "2026-11-12", daysBefore: 2, amount: "390.00" },
      ],
    },
    ...[
      { today: "2026-11-08", daysBefore: 7 },
      { today: "2026-11-14", daysBefore: 1 },
      { today: "2026-11-15", daysBefore: 0 },
    ].map(({ today, daysBefore }) => ({
      name: `reminds of a contract end ${daysBefore} days ahead`,
      items: [makeSubscription({ contractEndDate: "2026-11-15", reminders: reminders([], [7, 1, 0]) })],
      today,
      expiries: [{ name: "Netflix", date: "2026-11-15", daysBefore }],
    })),
    {
      name: "skips a contract end during a pause",
      items: [
        makeSubscription({
          contractEndDate: "2026-11-15",
          pauses: [{ id: 1, startDate: "2026-11-01", endDate: null }],
          reminders: reminders([], [7, 1, 0]),
        }),
      ],
      today: "2026-11-08",
    },
    {
      name: "ignores other days before a contract end",
      items: [makeSubscription({ contractEndDate: "2026-11-15", reminders: reminders([], [7, 1, 0]) })],
      today: "2026-11-10",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = collectDailyReminders(tt.items, tt.today);
      expect(result.today).toBe(tt.today);
      expect(
        result.charges.map(({ subscription, date, daysBefore, amount }) => ({
          name: subscription.name,
          date,
          daysBefore,
          amount,
        })),
      ).toEqual(tt.charges ?? []);
      expect(
        result.expiries.map(({ subscription, date, daysBefore }) => ({ name: subscription.name, date, daysBefore })),
      ).toEqual(tt.expiries ?? []);
    });
  }
});

describe("buildMonthlySummary", () => {
  const netflix = makeSubscription({ id: 1, name: "Netflix" });
  const chatGpt = makeSubscription({
    id: 2,
    name: "ChatGPT",
    currency: "USD",
    amount: "20.00",
    schedules: monthlyOn(5),
  });
  const domain = makeSubscription({
    id: 3,
    name: "網域",
    amount: "1200.00",
    amortize: true,
    schedules: [{ id: 30, cycle: "YEARLY", dayOfWeek: null, dayOfMonth: 1, month: 3 }],
  });
  const telecom = makeSubscription({ id: 4, name: "中華電信", amount: "599.00", contractEndDate: "2026-11-20" });
  const notAmortized = { ...domain, amortize: false };
  const emptyMonth = {
    month: { year: 2026, month: 11 },
    expiries: [],
    reserve: { totals: {}, names: [] },
    charge: { totals: {}, names: [] },
  };

  const tests = [
    {
      name: "sums the month's charges and reserves with their names",
      items: [netflix, chatGpt, domain, telecom],
      expected: {
        month: { year: 2026, month: 11 },
        expiries: [{ day: 20, date: "2026-11-20", subscription: telecom }],
        reserve: { totals: { TWD: 10000 }, names: ["網域"] },
        charge: { totals: { TWD: 98900, USD: 2000 }, names: ["Netflix", "中華電信", "ChatGPT"] },
      },
    },
    {
      name: "lists a subscription charged twice only once",
      items: [makeSubscription({ schedules: [...monthlyOn(1), { ...monthlyOn(15)[0], id: 11 }] })],
      expected: {
        month: { year: 2026, month: 11 },
        expiries: [],
        reserve: { totals: {}, names: [] },
        charge: { totals: { TWD: 78000 }, names: ["Netflix"] },
      },
    },
    {
      name: "leaves zero-amount charges and reserves out",
      items: [netflix, { ...chatGpt, amount: "0.00" }, { ...domain, amount: "0.00" }],
      expected: {
        month: { year: 2026, month: 11 },
        expiries: [],
        reserve: { totals: {}, names: [] },
        charge: { totals: { TWD: 39000 }, names: ["Netflix"] },
      },
    },
    {
      name: "leaves cancelled subscriptions out",
      items: [netflix, chatGpt, domain, telecom].map((item) => ({
        ...item,
        pauses: [{ id: 1, startDate: "2026-01-01", endDate: null }],
      })),
      expected: emptyMonth,
    },
    {
      name: "returns empty lists for a month without charges, reserves or contract ends",
      items: [notAmortized],
      expected: emptyMonth,
    },
    { name: "returns empty lists without subscriptions", items: [], expected: emptyMonth },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(buildMonthlySummary(tt.items, { year: 2026, month: 11 })).toEqual(tt.expected);
    });
  }
});

describe("hasNoReminders", () => {
  const charge = { date: "2026-11-10", daysBefore: 0, subscription: makeSubscription(), amount: "390.00" };
  const tests = [
    { name: "empty day", reminders: { charges: [], expiries: [] }, expected: true },
    { name: "a charge", reminders: { charges: [charge], expiries: [] }, expected: false },
    {
      name: "an expiry",
      reminders: { charges: [], expiries: [{ date: "2026-11-10", daysBefore: 0, subscription: charge.subscription }] },
      expected: false,
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(hasNoReminders({ today: "2026-11-10", ...tt.reminders })).toBe(tt.expected);
    });
  }
});

describe("isFirstOfMonth", () => {
  const tests = [
    { name: "the 1st", date: "2026-11-01", expected: true },
    { name: "the 2nd", date: "2026-11-02", expected: false },
    { name: "the 11th", date: "2026-11-11", expected: false },
    { name: "the 31st", date: "2026-12-31", expected: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isFirstOfMonth(tt.date)).toBe(tt.expected);
    });
  }
});
