import type { SubscriptionCharges } from "./billingSummary";

/** How the month's charge list is ordered. */
export type ChargeOrder = "date" | "category";

/** Display names of the charge list orders, in picker order. */
export const CHARGE_ORDER_LABELS: Record<ChargeOrder, string> = {
  date: "日期",
  category: "分類",
};

type Comparator = (a: SubscriptionCharges, b: SubscriptionCharges) => number;

const byDate: Comparator = (a, b) => a.days[0] - b.days[0] || a.subscription.name.localeCompare(b.subscription.name);

const byCategory: Comparator = (a, b) =>
  a.subscription.category.sortOrder - b.subscription.category.sortOrder ||
  a.subscription.category.id - b.subscription.category.id ||
  byDate(a, b);

const COMPARATORS: Record<ChargeOrder, Comparator> = { date: byDate, category: byCategory };

/**
 * Orders the month's per-subscription charges for display.
 *
 * @param charges - One entry per subscription, each with its charge days ascending.
 * @param order - "date" sorts by first charge day, then name; "category" keeps each category together in the
 *   categories' configured order, sorted by date within it.
 * @returns A new, sorted array; the input is left untouched.
 */
export function sortCharges(charges: SubscriptionCharges[], order: ChargeOrder): SubscriptionCharges[] {
  return [...charges].sort(COMPARATORS[order]);
}
