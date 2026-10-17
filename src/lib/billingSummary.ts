import type { Currency } from "@/generated/prisma/enums";
import type { SubscriptionDto } from "@/types/dto";
import { monthOccurrences, type Occurrence } from "./billingOccurrences";
import { CURRENCY_PREFIX, PAYMENT_TYPE_LABELS } from "./labels";

/** Totals in whole cents per currency; currencies without charges are absent. */
export type CurrencyTotals = Partial<Record<Currency, number>>;

/** A subscription's charges within one month. */
export interface SubscriptionCharges {
  subscription: SubscriptionDto;
  /** Distinct charge days, ascending. */
  days: number[];
  /** Number of charges; can exceed `days.length` when two schedules hit the same day. */
  count: number;
  totalCents: number;
  /** Amount of every charge in whole cents, or null when the charges differ (the amount changed mid-month). */
  unitCents: number | null;
}

/** A labelled subtotal, e.g. one category or one payment method. */
export interface GroupTotal {
  key: number;
  label: string;
  icon: string | null;
  totals: CurrencyTotals;
}

/** How a subscription is assigned to a group, and where that group sorts. */
interface GroupOf {
  key: number;
  label: string;
  icon: string | null;
  order: number;
}

/** Display order of currencies. */
const CURRENCIES = Object.keys(CURRENCY_PREFIX) as Currency[];

/**
 * Converts a decimal amount string to whole cents, so totals add up without floating-point drift.
 *
 * @param amount - Decimal string such as "15.49".
 */
export function toCents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

/**
 * Lists the currencies present in a total, in display order.
 *
 * @param totals - Totals per currency.
 * @returns `[currency, cents]` pairs.
 */
export function currencyEntries(totals: CurrencyTotals): [Currency, number][] {
  return CURRENCIES.flatMap((currency) => {
    const cents = totals[currency];
    return cents === undefined ? [] : [[currency, cents] as [Currency, number]];
  });
}

/**
 * Adds charges up per currency.
 *
 * @param occurrences - The charges.
 * @returns Whole-cent totals per currency.
 */
export function sumByCurrency(occurrences: Occurrence[]): CurrencyTotals {
  const totals: CurrencyTotals = {};
  for (const { subscription, amount } of occurrences) {
    totals[subscription.currency] = (totals[subscription.currency] ?? 0) + toCents(amount);
  }
  return totals;
}

/**
 * Collapses charges into one entry per subscription.
 *
 * @param occurrences - The month's charges.
 * @returns One entry per subscription, ordered by first charge day, then by name.
 */
export function chargesBySubscription(occurrences: Occurrence[]): SubscriptionCharges[] {
  const byId = new Map<number, SubscriptionCharges>();
  for (const { day, subscription, amount } of occurrences) {
    const cents = toCents(amount);
    const entry = byId.get(subscription.id) ?? { subscription, days: [], count: 0, totalCents: 0, unitCents: cents };
    if (!entry.days.includes(day)) entry.days.push(day);
    entry.count += 1;
    entry.totalCents += cents;
    if (entry.unitCents !== cents) entry.unitCents = null;
    byId.set(subscription.id, entry);
  }

  return [...byId.values()]
    .map((entry) => ({ ...entry, days: [...entry.days].sort((a, b) => a - b) }))
    .sort((a, b) => a.days[0] - b.days[0] || a.subscription.name.localeCompare(b.subscription.name));
}

/**
 * Adds charges up per group, keeping each group's currencies apart.
 *
 * @param occurrences - The charges.
 * @param groupOf - Assigns a subscription to its group.
 * @returns One subtotal per group, ordered by the group's `order`, then label.
 */
function groupTotals(occurrences: Occurrence[], groupOf: (subscription: SubscriptionDto) => GroupOf): GroupTotal[] {
  const groups = new Map<number, GroupOf & { occurrences: Occurrence[] }>();
  for (const occurrence of occurrences) {
    const group = groupOf(occurrence.subscription);
    const entry = groups.get(group.key) ?? { ...group, occurrences: [] };
    entry.occurrences.push(occurrence);
    groups.set(group.key, entry);
  }

  return [...groups.values()]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(({ key, label, icon, occurrences: grouped }) => ({ key, label, icon, totals: sumByCurrency(grouped) }));
}

/**
 * Subtotals per category, in the categories' configured order.
 *
 * @param occurrences - The charges.
 */
export function totalsByCategory(occurrences: Occurrence[]): GroupTotal[] {
  return groupTotals(occurrences, ({ category }) => ({
    key: category.id,
    label: category.name,
    icon: category.icon,
    order: category.sortOrder,
  }));
}

/**
 * Subtotals per payment method (card or account), in creation order.
 *
 * @param occurrences - The charges.
 */
export function totalsByPaymentMethod(occurrences: Occurrence[]): GroupTotal[] {
  return groupTotals(occurrences, ({ paymentMethod }) => ({
    key: paymentMethod.id,
    label: `${PAYMENT_TYPE_LABELS[paymentMethod.type]}・${paymentMethod.name}`,
    icon: null,
    order: paymentMethod.id,
  }));
}

/**
 * Adds up every charge of a calendar year, per currency.
 *
 * @param items - The subscriptions.
 * @param year - The year.
 * @returns Whole-cent totals per currency.
 */
export function yearTotals(items: SubscriptionDto[], year: number): CurrencyTotals {
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  return sumByCurrency(months.flatMap((month) => monthOccurrences(items, { year, month })));
}
