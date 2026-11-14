import type { Currency } from "@/generated/prisma/enums";
import { CURRENCY_PREFIX } from "../labels";
import { currencyEntries, type CurrencyTotals } from "../billing/money";

/** Amount split into a currency prefix and a grouped number, for separate styling. */
interface FormattedAmount {
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
