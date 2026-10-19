import type { SubscriptionDto } from "@/types/dto";
import type { CalendarDate, YearMonth } from "./calendarMonth";
import { dateKeyToUtcDate, toDateKey } from "./dateKey";

/** A subscription whose contract ends on a specific day of a month. */
export interface ContractExpiry {
  day: number;
  /** The contract's last day as "YYYY-MM-DD". */
  date: string;
  subscription: SubscriptionDto;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Lists the subscriptions whose contract ends in a month.
 *
 * @param items - The subscriptions; those without a contract end date are skipped.
 * @param target - The month.
 * @returns One entry per subscription, ordered by end date, then subscription name.
 */
export function monthContractExpiries(items: SubscriptionDto[], target: YearMonth): ContractExpiry[] {
  const monthPrefix = toDateKey({ ...target, day: 1 }).slice(0, 8);
  return items
    .flatMap((subscription) => {
      const date = subscription.contractEndDate;
      if (date === null || !date.startsWith(monthPrefix)) return [];
      return [{ day: Number(date.slice(8)), date, subscription }];
    })
    .sort((a, b) => a.day - b.day || a.subscription.name.localeCompare(b.subscription.name));
}

/**
 * Counts the whole days from today to a date. Both are read as UTC midnights, so daylight saving shifts
 * never add or drop a day.
 *
 * @param today - Today's date.
 * @param dateKey - The target day as "YYYY-MM-DD".
 * @returns 0 for today, positive for later days, negative for days already past.
 */
export function daysUntil(today: CalendarDate, dateKey: string): number {
  const diff = dateKeyToUtcDate(dateKey).getTime() - dateKeyToUtcDate(toDateKey(today)).getTime();
  return Math.round(diff / MS_PER_DAY);
}
