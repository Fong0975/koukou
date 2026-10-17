import type { Occurrence } from "./billingOccurrences";
import {
  chargesBySubscription,
  groupTotals,
  totalsByCategory,
  type GroupTotal,
  type SubscriptionCharges,
} from "./billingSummary";
import { formatChargeDate } from "./format";

/** How the month's charge list is grouped. */
export type ChargeOrder = "date" | "category";

/** Display names of the charge list orders, in picker order. */
export const CHARGE_ORDER_LABELS: Record<ChargeOrder, string> = {
  date: "日期",
  category: "分類",
};

/** A group of the month's charges with its subtotal and one entry per subscription. */
export interface ChargeGroup extends GroupTotal {
  /** The group's charges per subscription, ordered by first charge day, then name. */
  charges: SubscriptionCharges[];
}

/**
 * Subtotals per charge day, labelled with the date and weekday, in day order.
 *
 * @param occurrences - The charges.
 */
function totalsByDate(occurrences: Occurrence[]): GroupTotal[] {
  return groupTotals(occurrences, ({ day, date }) => ({
    key: day,
    label: formatChargeDate(date),
    icon: null,
    order: day,
  }));
}

const GROUP_TOTALS: Record<ChargeOrder, (occurrences: Occurrence[]) => GroupTotal[]> = {
  date: totalsByDate,
  category: totalsByCategory,
};

/**
 * Groups the month's charges for the charge list. Only days or categories with charges get a group; a
 * subscription charged on several days appears under each of those days.
 *
 * @param occurrences - The month's charges.
 * @param order - "date" makes one group per charge day; "category" one per category, in the categories'
 *   configured order.
 * @returns The groups, each with its subtotal and charges.
 */
export function chargeGroups(occurrences: Occurrence[], order: ChargeOrder): ChargeGroup[] {
  return GROUP_TOTALS[order](occurrences).map((group) => ({
    ...group,
    charges: chargesBySubscription(group.occurrences),
  }));
}
