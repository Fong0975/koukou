import type { Currency } from "@/generated/prisma/enums";
import type { BillingScheduleDto } from "@/types/dto";
import { AMORTIZATION_MONTHS } from "../billing/amortization";
import { CURRENCY_PREFIX, CYCLE_LABELS, WEEKDAY_LABELS } from "../labels";
import type { SubscriptionStatus } from "../billing/subscriptionStatus";
import { formatFullDate } from "./date";

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

/**
 * Lists days of a month in plain Chinese, e.g. "1、15 日".
 *
 * @param days - Days of the month, already in display order.
 * @returns The joined days with the "日" suffix.
 */
export function formatDays(days: number[]): string {
  return `${days.join("、")} 日`;
}

/**
 * Describes why a subscription does not charge, e.g. "暫停中・至 2026/04/30" or "已到期・2026/06/30".
 *
 * @param status - The subscription's status.
 */
export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  return status.kind === "paused"
    ? `暫停中・至 ${formatFullDate(status.until)}`
    : `已到期・${formatFullDate(status.endDate)}`;
}

/** A monthly reserve split into its rounded-up amount and the exact average, for separate styling. */
interface FormattedReserve {
  /** The rounded-up whole amount, e.g. "NT$ 84". */
  amount: string;
  /** The exact average to one decimal place, e.g. "NT$ 83.3", or the same as `amount` when the average is whole. */
  average: string;
}

/**
 * Formats a monthly reserve as its rounded-up whole amount and its exact average, which is shown to one decimal
 * place unless it is whole.
 *
 * @param currency - The currency.
 * @param reserveCents - The rounded-up reserve in cents; always a whole currency unit.
 * @param averageCents - The exact monthly share in cents; may be fractional.
 * @returns The amount and the average.
 */
export function formatReserve(currency: Currency, reserveCents: number, averageCents: number): FormattedReserve {
  const prefix = CURRENCY_PREFIX[currency];
  const amount = `${prefix} ${(reserveCents / 100).toLocaleString("en-US")}`;
  if (averageCents === reserveCents) return { amount, average: amount };
  const average = (averageCents / 100).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return { amount, average: `${prefix} ${average}` };
}

/** A reserve's description, split into segments that should each stay on one line. */
interface ReserveDetail {
  /** For wide screens, e.g. ["2027 年度", "第 3/12 期", "月均 NT$ 83.3"]. */
  full: string[];
  /** The same facts in fewer words for narrow screens, e.g. ["2027 年 3/12 期", "NT$ 83.3/月"]. */
  compact: string[];
}

/**
 * Describes a reserve by the year of the charge it saves for, which installment towards it this is and the
 * exact monthly average, in a full and a compact wording.
 *
 * @param chargeYear - The year of that charge.
 * @param installment - Which monthly installment this is, from 1 to {@link AMORTIZATION_MONTHS}.
 * @param average - The formatted monthly average, e.g. "NT$ 83.3".
 */
export function formatReserveDetail(chargeYear: number, installment: number, average: string): ReserveDetail {
  const progress = `${installment}/${AMORTIZATION_MONTHS}`;
  return {
    full: [`${chargeYear} 年度`, `第 ${progress} 期`, `月均 ${average}`],
    compact: [`${chargeYear} 年 ${progress} 期`, `${average}/月`],
  };
}
