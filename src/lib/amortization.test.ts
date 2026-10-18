// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeSubscription } from "@/test/fixtures";
import type { BillingScheduleDto, SubscriptionDto } from "@/types/dto";
import { monthReserves, sumReserves, type Reserve } from "./amortization";
import type { CalendarDate, YearMonth } from "./calendarMonth";

const yearly = (id: number, month: number, dayOfMonth: number): BillingScheduleDto => ({
  id,
  cycle: "YEARLY",
  dayOfWeek: null,
  dayOfMonth,
  month,
});

/** A TWD 1,000 domain renewal charged every 10/11, amortized. */
const domain = makeSubscription({
  id: 5,
  name: "網域",
  amount: "1000.00",
  amortize: true,
  startDate: "2025-01-01",
  schedules: [yearly(50, 10, 11)],
});

/** Reserve fields the tests compare; the subscription object is left out. */
interface ExpectedReserve {
  key: string;
  chargeDate: CalendarDate;
  reserveCents: number;
  averageCents: number;
}

type DateTuple = [year: number, month: number, day: number];

const reserveOf = (
  key: string,
  [year, month, day]: DateTuple,
  reserveCents: number,
  averageCents: number,
): ExpectedReserve => ({ key, chargeDate: { year, month, day }, reserveCents, averageCents });

/** The domain's reserve: TWD 1,000 / 12 = 83.3, rounded up to 84. */
const domainReserve = (chargeDate: DateTuple) => reserveOf("5-50", chargeDate, 8400, 100000 / 12);

describe("monthReserves", () => {
  const tests: { name: string; items: SubscriptionDto[]; target: YearMonth; expected: ExpectedReserve[] }[] = [
    {
      name: "first month of the period saves for the charge 12 months later",
      items: [domain],
      target: { year: 2025, month: 10 },
      expected: [domainReserve([2026, 10, 11])],
    },
    {
      name: "last month before the charge still saves for it",
      items: [domain],
      target: { year: 2026, month: 9 },
      expected: [domainReserve([2026, 10, 11])],
    },
    {
      name: "the charge month saves for next year's charge",
      items: [domain],
      target: { year: 2026, month: 10 },
      expected: [domainReserve([2027, 10, 11])],
    },
    {
      name: "not amortized → nothing",
      items: [{ ...domain, amortize: false }],
      target: { year: 2026, month: 5 },
      expected: [],
    },
    {
      name: "non-yearly schedules are ignored",
      items: [
        {
          ...domain,
          schedules: [{ id: 51, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 11, month: null }, yearly(52, 3, 1)],
        },
      ],
      target: { year: 2026, month: 5 },
      expected: [reserveOf("5-52", [2027, 3, 1], 8400, 100000 / 12)],
    },
    {
      name: "a charge before the start date is skipped",
      items: [{ ...domain, startDate: "2026-10-12" }],
      target: { year: 2026, month: 5 },
      expected: [],
    },
    {
      name: "months before the start date still save for a charge on or after it",
      items: [{ ...domain, startDate: "2026-10-11" }],
      target: { year: 2025, month: 10 },
      expected: [domainReserve([2026, 10, 11])],
    },
    {
      name: "a charge on the contract end date is still saved for",
      items: [{ ...domain, contractEndDate: "2026-10-11" }],
      target: { year: 2026, month: 5 },
      expected: [domainReserve([2026, 10, 11])],
    },
    {
      name: "a charge after the contract end date is skipped",
      items: [{ ...domain, contractEndDate: "2026-10-11" }],
      target: { year: 2026, month: 10 },
      expected: [],
    },
    {
      name: "uses the amount that applies on the charge date",
      items: [{ ...domain, amount: "1500.00", amountPeriods: [{ id: 1, amount: "1200.00", endDate: "2026-10-11" }] }],
      target: { year: 2026, month: 5 },
      expected: [reserveOf("5-50", [2026, 10, 11], 10000, 10000)],
    },
    {
      name: "the next charge picks up a later amount",
      items: [{ ...domain, amount: "1500.00", amountPeriods: [{ id: 1, amount: "1200.00", endDate: "2026-10-11" }] }],
      target: { year: 2026, month: 10 },
      expected: [reserveOf("5-50", [2027, 10, 11], 12500, 12500)],
    },
    {
      name: "USD rounds up to a whole dollar",
      items: [{ ...domain, currency: "USD", amount: "99.99" }],
      target: { year: 2026, month: 5 },
      expected: [reserveOf("5-50", [2026, 10, 11], 900, 9999 / 12)],
    },
    {
      name: "February 29 falls on the 28th in a common year",
      items: [{ ...domain, schedules: [yearly(53, 2, 29)] }],
      target: { year: 2026, month: 5 },
      expected: [reserveOf("5-53", [2027, 2, 28], 8400, 100000 / 12)],
    },
    {
      name: "February 29 stays in a leap year",
      items: [{ ...domain, schedules: [yearly(53, 2, 29)] }],
      target: { year: 2027, month: 5 },
      expected: [reserveOf("5-53", [2028, 2, 29], 8400, 100000 / 12)],
    },
    {
      name: "orders by charge date across schedules and subscriptions, then by name",
      items: [
        { ...domain, schedules: [yearly(50, 10, 11), yearly(54, 3, 1)] },
        makeSubscription({
          id: 6,
          name: "保險",
          amount: "12000.00",
          amortize: true,
          startDate: "2025-01-01",
          schedules: [yearly(60, 10, 11)],
        }),
      ],
      target: { year: 2026, month: 5 },
      expected: [
        reserveOf("6-60", [2026, 10, 11], 100000, 100000),
        domainReserve([2026, 10, 11]),
        reserveOf("5-54", [2027, 3, 1], 8400, 100000 / 12),
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const reserves = monthReserves(tt.items, tt.target);
      const actual = reserves.map(({ key, chargeDate, reserveCents, averageCents }) => ({
        key,
        chargeDate,
        reserveCents,
        averageCents,
      }));
      expect(actual).toEqual(tt.expected);
    });
  }
});

describe("sumReserves", () => {
  const reserve = (subscription: SubscriptionDto, reserveCents: number): Reserve => ({
    key: `${subscription.id}`,
    subscription,
    chargeDate: { year: 2026, month: 10, day: 11 },
    reserveCents,
    averageCents: reserveCents - 50,
  });
  const usd = makeSubscription({ id: 7, currency: "USD" });

  const tests = [
    { name: "no reserves", reserves: [], expected: {} },
    {
      name: "adds rounded-up reserves per currency",
      reserves: [reserve(domain, 8400), reserve(domain, 10000), reserve(usd, 900)],
      expected: { TWD: 18400, USD: 900 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(sumReserves(tt.reserves)).toEqual(tt.expected);
    });
  }
});
