import { dateKeyToUtcDate } from "@/lib/dateKey";
import type { SubscriptionData } from "@/lib/validation/subscriptionSchema";

/** Formats a validated amount for a DECIMAL(12, 2) column. */
export const toDecimalColumn = (amount: number) => amount.toFixed(2);

/**
 * Maps validated input to the scalar columns of a subscription.
 *
 * @param data - Validated subscription data.
 */
export function toSubscriptionColumns(data: SubscriptionData) {
  return {
    name: data.name,
    categoryId: data.categoryId,
    paymentMethodId: data.paymentMethodId,
    currency: data.currency,
    amount: toDecimalColumn(data.amount),
    amortize: data.amortize,
    startDate: dateKeyToUtcDate(data.startDate),
    contractEndDate: data.contractEndDate === null ? null : dateKeyToUtcDate(data.contractEndDate),
    note: data.note,
  };
}

/**
 * Maps validated past amounts to rows of the amount period table.
 *
 * @param data - Validated subscription data.
 */
export function toAmountPeriodRows(data: Pick<SubscriptionData, "amountPeriods">) {
  return data.amountPeriods.map((period) => ({
    amount: toDecimalColumn(period.amount),
    endDate: dateKeyToUtcDate(period.endDate),
  }));
}

/**
 * Maps validated pauses to rows of the pause table.
 *
 * @param data - Validated subscription data.
 */
export function toPauseRows(data: Pick<SubscriptionData, "pauses">) {
  return data.pauses.map((pause) => ({
    startDate: dateKeyToUtcDate(pause.startDate),
    endDate: dateKeyToUtcDate(pause.endDate),
  }));
}

/**
 * Maps validated reminders to rows of the reminder table.
 *
 * @param data - Validated subscription data.
 */
export function toReminderRows(data: Pick<SubscriptionData, "reminders">) {
  return [
    ...data.reminders.chargeDaysBefore.map((daysBefore) => ({ kind: "CHARGE" as const, daysBefore })),
    ...data.reminders.expiryDaysBefore.map((daysBefore) => ({ kind: "EXPIRY" as const, daysBefore })),
  ];
}
