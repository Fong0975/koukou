import type { Currency } from "@/generated/prisma/enums";
import type { BillingScheduleDto } from "@/types/dto";
import { AMORTIZATION_MONTHS } from "./amortization";
import { currencyEntries, type CurrencyTotals } from "./billingSummary";
import { toCalendarDate } from "./calendarMonth";
import { dateKeyToUtcDate, toDateKey } from "./dateKey";
import { CURRENCY_PREFIX, CYCLE_LABELS, WEEKDAY_LABELS } from "./labels";
import type { PauseStatus } from "./pauses";

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

/**
 * Formats a whole-cent total as a single string, e.g. "NT$ 1,290" or "US$ 46.47".
 *
 * @param currency - The currency.
 * @param cents - Amount in hundredths of the currency unit.
 * @returns The prefixed, grouped amount.
 */
export function formatCents(currency: Currency, cents: number): string {
  return formatAmountText(currency, (cents / 100).toFixed(2));
}

/**
 * Formats a decimal amount string as a single string, e.g. "NT$ 390" or "US$ 20.00".
 *
 * @param currency - The currency.
 * @param amount - Decimal string such as "390.00".
 * @returns The prefixed, grouped amount.
 */
export function formatAmountText(currency: Currency, amount: string): string {
  const { prefix, value } = formatAmount(currency, amount);
  return `${prefix} ${value}`;
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
 * Formats a charge date with its weekday, e.g. "10/1（四）".
 *
 * @param date - A "YYYY-MM-DD" key.
 */
export function formatChargeDate(date: string): string {
  const utc = dateKeyToUtcDate(date);
  return `${utc.getUTCMonth() + 1}/${utc.getUTCDate()}（${WEEKDAY_LABELS[utc.getUTCDay()]}）`;
}

/**
 * Describes how far away a contract's end date is, e.g. "剩 12 天", "今天到期" or "已到期 3 天".
 *
 * @param days - Days from today to the end date; negative once it has passed.
 */
export function formatContractRemaining(days: number): string {
  if (days > 0) return `剩 ${days} 天`;
  return days === 0 ? "今天到期" : `已到期 ${-days} 天`;
}

/**
 * Formats a date key with its year, e.g. "2027/03/31".
 *
 * @param date - A "YYYY-MM-DD" key.
 */
export function formatFullDate(date: string): string {
  return date.replaceAll("-", "/");
}

/**
 * Describes whether a subscription is paused or cancelled, e.g. "暫停中・至 2026/04/30" or "已取消・2026/08/01 起".
 *
 * @param status - The subscription's pause status.
 */
export function formatPauseStatus(status: PauseStatus): string {
  return status.kind === "paused"
    ? `暫停中・至 ${formatFullDate(status.until)}`
    : `已取消・${formatFullDate(status.since)} 起`;
}

/**
 * Formats an ISO timestamp as a local date and time, e.g. "2026/10/19 16:05".
 *
 * @param timestamp - An ISO timestamp.
 * @returns The formatted time, or the input unchanged when it is not a valid timestamp.
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  const time = [date.getHours(), date.getMinutes()].map((part) => String(part).padStart(2, "0")).join(":");
  return `${formatFullDate(toDateKey(toCalendarDate(date)))} ${time}`;
}

/** A monthly reserve split into its rounded-up amount and the exact average, for separate styling. */
export interface FormattedReserve {
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
export interface ReserveDetail {
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

/** One currency's part of a converted total. */
export interface ConvertedPart {
  /** The original amount, e.g. "US$ 31.00". */
  amount: string;
  /** What a foreign amount came to in TWD, e.g. "NT$ 1,000"; null for the TWD part. */
  twd: string | null;
}

/** A total converted to TWD, with the original amounts per currency when any of them was converted. */
export interface ConvertedTotal {
  /** E.g. "NT$ 1,500". */
  total: string;
  /** The original amounts in display order; empty when everything was already in TWD. */
  breakdown: ConvertedPart[];
}

/**
 * Formats a total converted to TWD together with the per-currency amounts it was converted from, e.g.
 * "NT$ 1,500" made of "NT$ 500" and "US$ 31.00" (which came to "NT$ 1,000"); a TWD-only total has no breakdown.
 * The foreign part's TWD is what is left of the converted total after its TWD part, so it adds up to the total
 * exactly instead of being converted again at a single rate; this relies on USD being the only foreign currency.
 *
 * @param twdCents - The converted total in whole cents.
 * @param totals - The original whole-cent totals per currency.
 * @returns The total and its breakdown, kept apart so they can be styled separately.
 */
export function formatConvertedTotal(twdCents: number, totals: CurrencyTotals): ConvertedTotal {
  const entries = currencyEntries(totals);
  const foreignTwd = formatCents("TWD", twdCents - (totals.TWD ?? 0));
  return {
    total: formatCents("TWD", twdCents),
    breakdown: entries.some(([currency]) => currency !== "TWD")
      ? entries.map(([currency, cents]) => ({
          amount: formatCents(currency, cents),
          twd: currency === "TWD" ? null : foreignTwd,
        }))
      : [],
  };
}

/**
 * Formats a converted amount as an approximation, e.g. "≈ NT$ 1,003".
 *
 * @param twdCents - The converted amount in whole cents.
 */
export function formatApproxTwd(twdCents: number): string {
  return `≈ ${formatCents("TWD", twdCents)}`;
}

/**
 * Formats a fraction as a whole percentage, e.g. "42%"; a non-zero fraction under 1% reads as "<1%".
 *
 * @param share - A fraction from 0 to 1.
 */
export function formatPercent(share: number): string {
  return share > 0 && share < 0.005 ? "<1%" : `${Math.round(share * 100)}%`;
}
