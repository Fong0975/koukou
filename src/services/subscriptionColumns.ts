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
