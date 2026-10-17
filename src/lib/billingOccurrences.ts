import type { BillingScheduleDto, SubscriptionDto } from "@/types/dto";
import { amountOn } from "./amountPeriods";
import { daysInMonth, type YearMonth } from "./calendarMonth";
import { toDateKey } from "./dateKey";

/** One charge of a subscription on a specific day of a month. */
export interface Occurrence {
  day: number;
  /** The charge day as "YYYY-MM-DD". */
  date: string;
  subscription: SubscriptionDto;
  scheduleId: number;
  /** Amount charged that day, taken from the amount period covering it. */
  amount: string;
}

type ScheduleRule = Pick<BillingScheduleDto, "cycle" | "dayOfWeek" | "dayOfMonth" | "month">;

/**
 * Lists the days of a month on which a billing rule charges.
 * A day of month the month does not have (e.g. the 31st in April) falls on its last day.
 *
 * @param schedule - The billing rule.
 * @param target - The month.
 * @returns Ascending days of the month (1-based); empty when the rule does not charge that month.
 */
export function scheduleDaysInMonth(schedule: ScheduleRule, target: YearMonth): number[] {
  const lastDay = daysInMonth(target);
  const clamped = [Math.min(schedule.dayOfMonth ?? 1, lastDay)];

  switch (schedule.cycle) {
    case "DAILY":
      return Array.from({ length: lastDay }, (_, index) => index + 1);
    case "WEEKLY": {
      const firstWeekday = new Date(target.year, target.month - 1, 1).getDay();
      const firstMatch = 1 + (((schedule.dayOfWeek ?? 0) - firstWeekday + 7) % 7);
      const days: number[] = [];
      for (let day = firstMatch; day <= lastDay; day += 7) {
        days.push(day);
      }
      return days;
    }
    case "MONTHLY":
      return clamped;
    case "YEARLY":
      return schedule.month === target.month ? clamped : [];
  }
}

/**
 * Lists one subscription's charges in a month, skipping days before its start date and
 * pricing each charge with the amount that applied on that day.
 *
 * @param subscription - The subscription.
 * @param target - The month.
 * @returns The charges in schedule order, each schedule's days ascending.
 */
function subscriptionOccurrences(subscription: SubscriptionDto, target: YearMonth): Occurrence[] {
  return subscription.schedules.flatMap((schedule) =>
    scheduleDaysInMonth(schedule, target).flatMap((day) => {
      const dateKey = toDateKey({ ...target, day });
      if (dateKey < subscription.startDate) return [];
      return [{ day, date: dateKey, subscription, scheduleId: schedule.id, amount: amountOn(subscription, dateKey) }];
    }),
  );
}

/**
 * Expands subscriptions into every charge they make in a month; each schedule charges separately.
 *
 * @param items - The subscriptions.
 * @param target - The month.
 * @returns The charges, ordered by day (ties keep the input order).
 */
export function monthOccurrences(items: SubscriptionDto[], target: YearMonth): Occurrence[] {
  return items.flatMap((subscription) => subscriptionOccurrences(subscription, target)).sort((a, b) => a.day - b.day);
}

/**
 * Expands subscriptions into every charge they make in a calendar year.
 *
 * @param items - The subscriptions.
 * @param year - The year.
 * @returns The charges, ordered by date (ties keep the input order).
 */
export function yearOccurrences(items: SubscriptionDto[], year: number): Occurrence[] {
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  return months.flatMap((month) => monthOccurrences(items, { year, month }));
}

/**
 * Groups charges by the day they fall on.
 *
 * @param occurrences - The charges.
 * @returns A map from day of month to that day's charges, in input order.
 */
export function occurrencesByDay(occurrences: Occurrence[]): Map<number, Occurrence[]> {
  const byDay = new Map<number, Occurrence[]>();
  for (const occurrence of occurrences) {
    byDay.set(occurrence.day, [...(byDay.get(occurrence.day) ?? []), occurrence]);
  }
  return byDay;
}
