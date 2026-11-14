import type { Occurrence } from "../billing/billingOccurrences";
import type { ContractExpiry } from "../billing/contractExpiries";
import { formatAmountText } from "../format/money";

/** One wide-screen chip of a calendar day: a contract expiry or a charge. */
export interface Chip {
  key: string;
  variant: "expiry" | "charge";
  icon: string | null;
  label: string;
  title: string;
  /** Formatted charge amount; null for an expiry. */
  amount: string | null;
}

/**
 * Lists a calendar day's chips, contract expiries first so they are not the ones collapsed into "+N".
 *
 * @param occurrences - The day's charges.
 * @param expiries - The contracts ending that day.
 */
export function dayChips(occurrences: Occurrence[], expiries: ContractExpiry[]): Chip[] {
  return [
    ...expiries.map(({ subscription }): Chip => ({
      key: `expiry-${subscription.id}`,
      variant: "expiry",
      icon: subscription.category.icon,
      label: `${subscription.name} 到期`,
      title: `${subscription.name} 到期`,
      amount: null,
    })),
    ...occurrences.map(({ subscription, scheduleId, amount }): Chip => {
      const formatted = formatAmountText(subscription.currency, amount);
      return {
        key: `${subscription.id}-${scheduleId}`,
        variant: "charge",
        icon: subscription.category.icon,
        label: subscription.name,
        title: `${subscription.name} ${formatted}`,
        amount: formatted,
      };
    }),
  ];
}

/**
 * Builds a calendar day cell's accessible name, e.g. "15 日（今天）：Netflix、Spotify；到期：中華電信".
 *
 * @param day - Day of the month.
 * @param isToday - Whether it is today.
 * @param occurrences - The day's charges.
 * @param expiries - The contracts ending that day.
 */
export function cellLabel(
  day: number,
  isToday: boolean,
  occurrences: Occurrence[],
  expiries: ContractExpiry[],
): string {
  const date = `${day} 日${isToday ? "（今天）" : ""}`;
  const names = (items: { subscription: { name: string } }[]) => items.map((o) => o.subscription.name).join("、");
  const parts = [
    ...(occurrences.length > 0 ? [names(occurrences)] : []),
    ...(expiries.length > 0 ? [`到期：${names(expiries)}`] : []),
  ];
  return parts.length === 0 ? date : `${date}：${parts.join("；")}`;
}
