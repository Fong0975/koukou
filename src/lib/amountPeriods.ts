import type { SubscriptionDto } from "@/types/dto";
import { addDays } from "./dateKey";

/** The parts of a subscription that decide how much it charges on a given day. */
export type AmountHistory = Pick<SubscriptionDto, "amount" | "amountPeriods">;

/** A past amount together with the first day it applies. */
export interface AmountPeriodRange<T> {
  period: T;
  /** First day ("YYYY-MM-DD") the period applies; its `endDate` is the last. */
  start: string;
}

/** Periods of a subscription's amount history, ordered by end date. */
export interface AmountPeriodRanges<T> {
  ranges: AmountPeriodRange<T>[];
  /** First day the current amount applies. */
  currentStart: string;
}

/**
 * Finds the amount a subscription charges on a day: the first past amount whose end date
 * is on or after that day, otherwise the current amount.
 *
 * @param subscription - Its current amount and past amounts, ordered by end date as the API returns them.
 * @param dateKey - The day as "YYYY-MM-DD".
 * @returns The amount as a decimal string.
 */
export function amountOn(subscription: AmountHistory, dateKey: string): string {
  return subscription.amountPeriods.find((period) => period.endDate >= dateKey)?.amount ?? subscription.amount;
}

/**
 * Works out when each past amount starts: the first one on the subscription's start date,
 * each later one the day after the previous end date.
 *
 * @param startDate - The subscription's start date ("YYYY-MM-DD").
 * @param periods - Past amounts in any order, e.g. form rows still being edited.
 * @returns The periods ordered by end date with their start days, and when the current amount starts.
 */
export function amountPeriodRanges<T extends { endDate: string }>(
  startDate: string,
  periods: readonly T[],
): AmountPeriodRanges<T> {
  const ordered = [...periods].sort((a, b) => a.endDate.localeCompare(b.endDate));
  let start = startDate;
  const ranges = ordered.map((period) => {
    const range = { period, start };
    start = addDays(period.endDate, 1);
    return range;
  });
  return { ranges, currentStart: start };
}
