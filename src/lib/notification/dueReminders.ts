import type { SubscriptionDto } from "@/types/dto";
import { monthReserves, sumReserves } from "../amortization";
import { monthOccurrences } from "../billingOccurrences";
import { sumByCurrency, type CurrencyTotals } from "../billingSummary";
import type { YearMonth } from "../calendarMonth";
import { monthContractExpiries, type ContractExpiry } from "../contractExpiries";
import { addDays, dateKeyToYearMonth } from "../dateKey";

/** An upcoming charge a subscription asked to be reminded of. */
export interface ChargeReminder {
  /** The charge day as "YYYY-MM-DD". */
  date: string;
  /** Days from today to the charge; 0 on the day itself. */
  daysBefore: number;
  subscription: SubscriptionDto;
  /** Amount charged that day as a decimal string. */
  amount: string;
}

/** An upcoming contract end a subscription asked to be reminded of. */
export interface ExpiryReminder {
  /** The contract's last day as "YYYY-MM-DD". */
  date: string;
  /** Days from today to the end date; 0 on the day itself. */
  daysBefore: number;
  subscription: SubscriptionDto;
}

/** A month's total in each currency together with the subscriptions it is made of. */
export interface NamedTotal {
  totals: CurrencyTotals;
  /** Distinct subscription names, in the order they first appear. */
  names: string[];
}

/** What the month ahead holds, sent on its 1st. */
export interface MonthlySummary {
  month: YearMonth;
  expiries: ContractExpiry[];
  /** What to set aside this month for upcoming yearly charges. */
  reserve: NamedTotal;
  /** What is charged this month. */
  charge: NamedTotal;
}

/** Everything one day's message reports. */
export interface DailyReminders {
  /** The day the reminders are sent, "YYYY-MM-DD". */
  today: string;
  /** Present only on the 1st of a month with the summary switched on and something to report. */
  monthlySummary: MonthlySummary | null;
  /** Ordered by charge day, then subscription name. */
  charges: ChargeReminder[];
  /** Ordered by end date, then subscription name. */
  expiries: ExpiryReminder[];
}

/** Options of {@link collectDailyReminders}. */
export interface CollectOptions {
  /** Whether the 1st of a month carries the month's summary. */
  monthlySummary: boolean;
}

const uniqueNames = (subscriptions: SubscriptionDto[]) => [...new Set(subscriptions.map(({ name }) => name))];

const byDateThenName = (a: { date: string; subscription: SubscriptionDto }, b: typeof a) =>
  a.date.localeCompare(b.date) || a.subscription.name.localeCompare(b.subscription.name);

/**
 * Lists the charges a subscription's charge reminders fire for today. A day charged by several
 * schedules yields one reminder per charge.
 *
 * @param subscription - The subscription.
 * @param today - Today as "YYYY-MM-DD".
 */
function subscriptionChargeReminders(subscription: SubscriptionDto, today: string): ChargeReminder[] {
  return subscription.reminders.chargeDaysBefore.flatMap((daysBefore) => {
    const date = addDays(today, daysBefore);
    return monthOccurrences([subscription], dateKeyToYearMonth(date))
      .filter((occurrence) => occurrence.date === date)
      .map((occurrence) => ({ date, daysBefore, subscription, amount: occurrence.amount }));
  });
}

/**
 * Lists the contract ends a subscription's expiry reminders fire for today.
 *
 * @param subscription - The subscription.
 * @param today - Today as "YYYY-MM-DD".
 */
function subscriptionExpiryReminders(subscription: SubscriptionDto, today: string): ExpiryReminder[] {
  const { contractEndDate } = subscription;
  if (contractEndDate === null) return [];
  return subscription.reminders.expiryDaysBefore
    .filter((daysBefore) => addDays(today, daysBefore) === contractEndDate)
    .map((daysBefore) => ({ date: contractEndDate, daysBefore, subscription }));
}

/**
 * Builds the summary of a month: its contract ends, its reserves for yearly charges and its charges.
 *
 * @param items - Every subscription.
 * @param month - The month.
 * @returns The summary, or null when the month has nothing to report.
 */
export function buildMonthlySummary(items: SubscriptionDto[], month: YearMonth): MonthlySummary | null {
  const expiries = monthContractExpiries(items, month);
  const reserves = monthReserves(items, month);
  const charges = monthOccurrences(items, month);
  if (expiries.length === 0 && reserves.length === 0 && charges.length === 0) return null;
  return {
    month,
    expiries,
    reserve: { totals: sumReserves(reserves), names: uniqueNames(reserves.map(({ subscription }) => subscription)) },
    charge: { totals: sumByCurrency(charges), names: uniqueNames(charges.map(({ subscription }) => subscription)) },
  };
}

/**
 * Collects everything to report in today's message.
 *
 * @param items - Every subscription.
 * @param today - Today as "YYYY-MM-DD".
 * @param options - Which optional parts to include.
 */
export function collectDailyReminders(
  items: SubscriptionDto[],
  today: string,
  options: CollectOptions,
): DailyReminders {
  const isFirstOfMonth = today.endsWith("-01");
  return {
    today,
    monthlySummary:
      options.monthlySummary && isFirstOfMonth ? buildMonthlySummary(items, dateKeyToYearMonth(today)) : null,
    charges: items.flatMap((subscription) => subscriptionChargeReminders(subscription, today)).sort(byDateThenName),
    expiries: items.flatMap((subscription) => subscriptionExpiryReminders(subscription, today)).sort(byDateThenName),
  };
}

/**
 * Tells whether a day's reminders have nothing to send.
 *
 * @param reminders - The day's reminders.
 */
export function hasNoReminders(reminders: DailyReminders): boolean {
  return reminders.monthlySummary === null && reminders.charges.length === 0 && reminders.expiries.length === 0;
}
