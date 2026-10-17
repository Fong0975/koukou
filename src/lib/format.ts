import type { Currency } from "@/generated/prisma/enums";
import type { BillingScheduleDto } from "@/types/dto";
import { currencyEntries, type CurrencyTotals } from "./billingSummary";
import type { CalendarDate } from "./calendarMonth";
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

/**
 * Formats a whole-cent total as a single string, e.g. "NT$ 1,290" or "US$ 46.47".
 *
 * @param currency - The currency.
 * @param cents - Amount in hundredths of the currency unit.
 * @returns The prefixed, grouped amount.
 */
export function formatCents(currency: Currency, cents: number): string {
  const { prefix, value } = formatAmount(currency, (cents / 100).toFixed(2));
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
 * Formats a monthly reserve as its rounded-up whole amount, followed by the exact average
 * to one decimal place when that average is not whole, e.g. "NT$ 84 (83.3)" or "NT$ 100".
 *
 * @param currency - The currency.
 * @param reserveCents - The rounded-up reserve in cents; always a whole currency unit.
 * @param averageCents - The exact monthly share in cents; may be fractional.
 * @returns The formatted reserve.
 */
export function formatReserve(currency: Currency, reserveCents: number, averageCents: number): string {
  const amount = `${CURRENCY_PREFIX[currency]} ${(reserveCents / 100).toLocaleString("en-US")}`;
  if (averageCents === reserveCents) return amount;
  const average = (averageCents / 100).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${amount} (${average})`;
}

/**
 * Names the yearly charge a reserve saves up for, e.g. "2026 年期（10/11 扣款）".
 *
 * @param chargeDate - The date of that charge.
 * @returns The term year and charge day.
 */
export function formatReserveTerm({ year, month, day }: CalendarDate): string {
  return `${year} 年期（${month}/${day} 扣款）`;
}

/** A total converted to TWD, with the original amounts per currency when any of them was converted. */
export interface ConvertedTotal {
  /** E.g. "NT$ 1,500". */
  total: string;
  /** E.g. "NT$ 500, US$ 31.00", or null when everything was already in TWD. */
  breakdown: string | null;
}

/**
 * Formats a total converted to TWD together with what it is made of, read as
 * "NT$ 1,500 (NT$ 500, US$ 31.00)" or "NT$ 1,000 (US$ 31.00)"; a TWD-only total has no breakdown.
 *
 * @param twdCents - The converted total in whole cents.
 * @param totals - The original whole-cent totals per currency.
 * @returns The total and its breakdown, kept apart so they can be styled separately.
 */
export function formatConvertedTotal(twdCents: number, totals: CurrencyTotals): ConvertedTotal {
  const entries = currencyEntries(totals);
  const converted = entries.some(([currency]) => currency !== "TWD");
  return {
    total: formatCents("TWD", twdCents),
    breakdown: converted ? entries.map(([currency, cents]) => formatCents(currency, cents)).join(", ") : null,
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
