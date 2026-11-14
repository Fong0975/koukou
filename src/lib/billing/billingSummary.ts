import type { PaymentType } from "@/generated/prisma/enums";
import type { SubscriptionDto } from "@/types/dto";
import type { Occurrence } from "./billingOccurrences";
import { PAYMENT_TYPE_LABELS } from "../labels";
import { type CurrencyTotals, sumByCurrency, toCents } from "./money";
import { paymentTypeRank } from "../lookups/paymentMethodOrder";

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
  /** The charges themselves, in input order. */
  occurrences: Occurrence[];
}

/** A labelled subtotal, e.g. one category or one payment method. */
export interface GroupTotal {
  key: number;
  label: string;
  icon: string | null;
  totals: CurrencyTotals;
  /** The group's charges, in input order. */
  occurrences: Occurrence[];
}

/** Subtotals of one payment type, e.g. every credit card. */
export interface PaymentTypeTotals {
  type: PaymentType;
  label: string;
  /** One subtotal per payment method of this type. */
  groups: GroupTotal[];
}

/** How a charge is assigned to a group, and where that group sorts. */
interface GroupOf {
  key: number;
  label: string;
  icon: string | null;
  order: number;
}

/**
 * Collapses charges into one entry per subscription.
 *
 * @param occurrences - The month's charges.
 * @returns One entry per subscription, ordered by first charge day, then by name.
 */
export function chargesBySubscription(occurrences: Occurrence[]): SubscriptionCharges[] {
  const byId = new Map<number, SubscriptionCharges>();
  for (const occurrence of occurrences) {
    const { day, subscription, amount } = occurrence;
    const cents = toCents(amount);
    const entry = byId.get(subscription.id) ?? {
      subscription,
      days: [],
      count: 0,
      totalCents: 0,
      unitCents: cents,
      occurrences: [],
    };
    if (!entry.days.includes(day)) entry.days.push(day);
    entry.occurrences.push(occurrence);
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
 * @param groupOf - Assigns a charge to its group.
 * @returns One subtotal per group that has charges, ordered by the group's `order`, then label.
 */
export function groupTotals(occurrences: Occurrence[], groupOf: (occurrence: Occurrence) => GroupOf): GroupTotal[] {
  const groups = new Map<number, GroupOf & { occurrences: Occurrence[] }>();
  for (const occurrence of occurrences) {
    const group = groupOf(occurrence);
    const entry = groups.get(group.key) ?? { ...group, occurrences: [] };
    entry.occurrences.push(occurrence);
    groups.set(group.key, entry);
  }

  return [...groups.values()]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(({ key, label, icon, occurrences: grouped }) => ({
      key,
      label,
      icon,
      totals: sumByCurrency(grouped),
      occurrences: grouped,
    }));
}

/**
 * Subtotals per category, in the categories' configured order.
 *
 * @param occurrences - The charges.
 */
export function totalsByCategory(occurrences: Occurrence[]): GroupTotal[] {
  return groupTotals(occurrences, ({ subscription: { category } }) => ({
    key: category.id,
    label: category.name,
    icon: category.icon,
    order: category.sortOrder,
  }));
}

/**
 * Subtotals per payment method (card or account), labelled with its name and ordered by payment type, then name.
 *
 * @param occurrences - The charges.
 */
export function totalsByPaymentMethod(occurrences: Occurrence[]): GroupTotal[] {
  return groupTotals(occurrences, ({ subscription: { paymentMethod } }) => ({
    key: paymentMethod.id,
    label: paymentMethod.name,
    icon: null,
    order: paymentTypeRank(paymentMethod.type),
  }));
}

/**
 * Subtotals per payment method, sectioned by payment type.
 *
 * @param occurrences - The charges.
 * @returns One section per payment type that has charges, in display order (credit card, bank account, other).
 */
export function totalsByPaymentType(occurrences: Occurrence[]): PaymentTypeTotals[] {
  const byType = new Map<PaymentType, Occurrence[]>();
  for (const occurrence of occurrences) {
    const { type } = occurrence.subscription.paymentMethod;
    const group = byType.get(type);
    if (group) group.push(occurrence);
    else byType.set(type, [occurrence]);
  }

  return [...byType.entries()]
    .sort(([a], [b]) => paymentTypeRank(a) - paymentTypeRank(b))
    .map(([type, grouped]) => ({ type, label: PAYMENT_TYPE_LABELS[type], groups: totalsByPaymentMethod(grouped) }));
}
