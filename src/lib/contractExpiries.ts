import type { SubscriptionDto } from "@/types/dto";
import type { YearMonth } from "./calendarMonth";
import { toDateKey } from "./dateKey";
import { isPausedOn } from "./pauses";

/** A subscription whose contract ends on a specific day of a month. */
export interface ContractExpiry {
  day: number;
  /** The contract's last day as "YYYY-MM-DD". */
  date: string;
  subscription: SubscriptionDto;
}

/**
 * Lists the subscriptions whose contract ends in a month.
 *
 * @param items - The subscriptions; those without a contract end date, or whose end date falls in a pause, are
 *   skipped.
 * @param target - The month.
 * @returns One entry per subscription, ordered by end date, then subscription name.
 */
export function monthContractExpiries(items: SubscriptionDto[], target: YearMonth): ContractExpiry[] {
  const monthPrefix = toDateKey({ ...target, day: 1 }).slice(0, 8);
  return items
    .flatMap((subscription) => {
      const date = subscription.contractEndDate;
      if (date === null || !date.startsWith(monthPrefix) || isPausedOn(subscription.pauses, date)) return [];
      return [{ day: Number(date.slice(8)), date, subscription }];
    })
    .sort((a, b) => a.day - b.day || a.subscription.name.localeCompare(b.subscription.name));
}
