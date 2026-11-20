import type { Occurrence } from "../billing/billingOccurrences";
import type { ContractExpiry } from "../billing/contractExpiries";
import { formatAmountText } from "../format/money";

/** Label of the reserve total shown on the first day of a month. */
export const RESERVE_LABEL = "預扣";

/** Name of the reserve total's row in a popup. */
export const RESERVE_TOTAL_NAME = "本月預扣合計";

/** Icon of the reserve total, in place of a category icon; the same one the summary notification uses. */
export const RESERVE_ICON = "🗓️";

/** One wide-screen chip of a calendar day: a contract expiry, the month's reserve total or a charge. */
export interface Chip {
  key: string;
  variant: "expiry" | "reserve" | "charge";
  icon: string | null;
  label: string;
  /** Plain name for listing under a group heading, without the kind's wording such as "到期". */
  name: string;
  title: string;
  /** Formatted charge or reserve amount; null for an expiry. */
  amount: string | null;
}

/**
 * Lists a calendar day's chips from most to least severe: contract expiries, charges, then the reserve total,
 * so the least severe are the ones collapsed into "+N".
 *
 * @param occurrences - The day's charges.
 * @param expiries - The contracts ending that day.
 * @param reserveTotal - The formatted reserve total when this day shows it, otherwise null.
 */
export function dayChips(
  occurrences: Occurrence[],
  expiries: ContractExpiry[],
  reserveTotal: string | null = null,
): Chip[] {
  return [
    ...expiries.map(({ subscription }): Chip => ({
      key: `expiry-${subscription.id}`,
      variant: "expiry",
      icon: subscription.category.icon,
      label: `${subscription.name} 到期`,
      name: subscription.name,
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
        name: subscription.name,
        title: `${subscription.name} ${formatted}`,
        amount: formatted,
      };
    }),
    ...(reserveTotal === null
      ? []
      : [
          {
            key: "reserve",
            variant: "reserve",
            icon: RESERVE_ICON,
            label: RESERVE_LABEL,
            name: RESERVE_TOTAL_NAME,
            title: `${RESERVE_LABEL} ${reserveTotal}`,
            amount: reserveTotal,
          } satisfies Chip,
        ]),
  ];
}

/**
 * Builds a calendar day cell's accessible name, e.g. "1 日（今天）：Netflix、Spotify；到期：中華電信；預扣：NT$ 1,500".
 *
 * @param day - Day of the month.
 * @param isToday - Whether it is today.
 * @param occurrences - The day's charges.
 * @param expiries - The contracts ending that day.
 * @param reserveTotal - The formatted reserve total when this day shows it, otherwise null.
 */
export function cellLabel(
  day: number,
  isToday: boolean,
  occurrences: Occurrence[],
  expiries: ContractExpiry[],
  reserveTotal: string | null = null,
): string {
  const date = `${day} 日${isToday ? "（今天）" : ""}`;
  const names = (items: { subscription: { name: string } }[]) => items.map((o) => o.subscription.name).join("、");
  const parts = [
    ...(occurrences.length > 0 ? [names(occurrences)] : []),
    ...(expiries.length > 0 ? [`到期：${names(expiries)}`] : []),
    ...(reserveTotal === null ? [] : [`${RESERVE_LABEL}：${reserveTotal}`]),
  ];
  return parts.length === 0 ? date : `${date}：${parts.join("；")}`;
}
