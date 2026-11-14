import type { Currency } from "@/generated/prisma/enums";
import type { Occurrence } from "./billingOccurrences";
import { CURRENCY_PREFIX } from "./labels";

/** Totals in whole cents per currency; currencies without charges are absent. */
export type CurrencyTotals = Partial<Record<Currency, number>>;

/** Display order of currencies. */
const CURRENCIES = Object.keys(CURRENCY_PREFIX) as Currency[];

/**
 * Converts a decimal amount string to whole cents, so totals add up without floating-point drift.
 *
 * @param amount - Decimal string such as "15.49".
 */
export function toCents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

/**
 * Lists the currencies present in a total, in display order.
 *
 * @param totals - Totals per currency.
 * @returns `[currency, cents]` pairs.
 */
export function currencyEntries(totals: CurrencyTotals): [Currency, number][] {
  return CURRENCIES.flatMap((currency) => {
    const cents = totals[currency];
    return cents === undefined ? [] : [[currency, cents] as [Currency, number]];
  });
}

/**
 * Adds whole-cent amounts up per currency.
 *
 * @param entries - `[currency, cents]` pairs.
 * @returns Whole-cent totals per currency.
 */
export function totalByCurrency(entries: Iterable<readonly [Currency, number]>): CurrencyTotals {
  const totals: CurrencyTotals = {};
  for (const [currency, cents] of entries) {
    totals[currency] = (totals[currency] ?? 0) + cents;
  }
  return totals;
}

/**
 * Adds charges up per currency.
 *
 * @param occurrences - The charges.
 * @returns Whole-cent totals per currency.
 */
export function sumByCurrency(occurrences: Occurrence[]): CurrencyTotals {
  return totalByCurrency(
    occurrences.map(({ subscription, amount }) => [subscription.currency, toCents(amount)] as const),
  );
}
