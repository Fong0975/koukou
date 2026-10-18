import type { BillingScheduleDto, SubscriptionDto } from "@/types/dto";
import { amountOn } from "./amountPeriods";
import { isActiveOn, scheduleDaysInMonth } from "./billingOccurrences";
import { toCents, totalByCurrency, type CurrencyTotals } from "./billingSummary";
import type { CalendarDate, YearMonth } from "./calendarMonth";
import { toDateKey } from "./dateKey";

/** Number of months before a yearly charge that it is spread over. */
export const AMORTIZATION_MONTHS = 12;

/** The share of an upcoming yearly charge to set aside in one month. */
export interface Reserve {
  /** Unique per subscription and schedule. */
  key: string;
  subscription: SubscriptionDto;
  /** The yearly charge this reserve saves up for. */
  chargeDate: CalendarDate;
  /** Amount to set aside, rounded up to a whole currency unit, in cents. */
  reserveCents: number;
  /** Exact monthly share in cents; may be fractional. */
  averageCents: number;
}

/**
 * Finds the yearly charge a month saves up for: the first one after that month, so the
 * charge month itself already saves for the next year (a 2026-10-11 charge is spread over
 * 2025-10 – 2026-09).
 *
 * @param schedule - A YEARLY billing rule.
 * @param target - The month doing the saving.
 * @returns The charge date, with a missing day of month moved to the month's last day.
 */
function upcomingChargeDate(schedule: BillingScheduleDto, target: YearMonth): CalendarDate {
  const month = schedule.month ?? 1;
  const year = month > target.month ? target.year : target.year + 1;
  const [day] = scheduleDaysInMonth(schedule, { year, month });
  return { year, month, day };
}

/**
 * Builds the reserve of one yearly schedule for a month, or none when that charge falls
 * before the subscription starts or after its contract ends.
 *
 * @param subscription - An amortized subscription.
 * @param schedule - One of its YEARLY billing rules.
 * @param target - The month.
 */
function scheduleReserve(subscription: SubscriptionDto, schedule: BillingScheduleDto, target: YearMonth): Reserve[] {
  const chargeDate = upcomingChargeDate(schedule, target);
  const dateKey = toDateKey(chargeDate);
  if (!isActiveOn(subscription, dateKey)) return [];

  const averageCents = toCents(amountOn(subscription, dateKey)) / AMORTIZATION_MONTHS;
  return [
    {
      key: `${subscription.id}-${schedule.id}`,
      subscription,
      chargeDate,
      reserveCents: Math.ceil(averageCents / 100) * 100,
      averageCents,
    },
  ];
}

/**
 * Lists what to set aside in a month for the upcoming yearly charges of amortized subscriptions.
 * Each charge is split evenly over the 12 months before its charge month.
 *
 * @param items - The subscriptions; only those with `amortize` and a YEARLY schedule contribute.
 * @param target - The month.
 * @returns One reserve per yearly schedule, ordered by charge date, then subscription name.
 */
export function monthReserves(items: SubscriptionDto[], target: YearMonth): Reserve[] {
  return items
    .filter((subscription) => subscription.amortize)
    .flatMap((subscription) =>
      subscription.schedules
        .filter((schedule) => schedule.cycle === "YEARLY")
        .flatMap((schedule) => scheduleReserve(subscription, schedule, target)),
    )
    .sort(
      (a, b) =>
        toDateKey(a.chargeDate).localeCompare(toDateKey(b.chargeDate)) ||
        a.subscription.name.localeCompare(b.subscription.name),
    );
}

/**
 * Adds the rounded-up reserves up per currency.
 *
 * @param reserves - The month's reserves.
 * @returns Whole-cent totals per currency.
 */
export function sumReserves(reserves: Reserve[]): CurrencyTotals {
  return totalByCurrency(
    reserves.map(({ subscription, reserveCents }) => [subscription.currency, reserveCents] as const),
  );
}
