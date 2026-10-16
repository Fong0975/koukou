import type { Currency } from "@/generated/prisma/enums";
import type { BillingScheduleDto } from "@/types/dto";
import { CURRENCY_PREFIX, CYCLE_LABELS, WEEKDAY_LABELS } from "./labels";

/** Amount split into a currency prefix and a grouped number, for separate styling. */
export interface FormattedAmount {
  prefix: string;
  value: string;
}

/**
 * Formats a money amount. USD always shows cents; TWD hides ".00".
 *
 * @param currency - The currency.
 * @param amount - Decimal string such as "390.00".
 * @returns The prefix (e.g. "NT$") and grouped value (e.g. "1,290").
 */
export function formatAmount(currency: Currency, amount: string): FormattedAmount {
  const numeric = Number(amount);
  const showCents = currency === "USD" || !Number.isInteger(numeric);
  const value = numeric.toLocaleString("en-US", {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return { prefix: CURRENCY_PREFIX[currency], value };
}

/**
 * Describes a billing rule in plain Chinese, e.g. "每月 15 日" or "每週三".
 *
 * @param schedule - The billing rule.
 * @returns A human-readable description.
 */
export function formatSchedule(
  schedule: Pick<BillingScheduleDto, "cycle" | "dayOfWeek" | "dayOfMonth" | "month">,
): string {
  const label = CYCLE_LABELS[schedule.cycle];
  switch (schedule.cycle) {
    case "DAILY":
      return label;
    case "WEEKLY":
      return `${label}${WEEKDAY_LABELS[schedule.dayOfWeek ?? 0]}`;
    case "MONTHLY":
      return `${label} ${schedule.dayOfMonth} 日`;
    case "YEARLY":
      return `${label} ${schedule.month} 月 ${schedule.dayOfMonth} 日`;
  }
}
