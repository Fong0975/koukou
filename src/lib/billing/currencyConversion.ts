import type { Currency } from "@/generated/prisma/enums";
import type { ExchangeRateDto } from "@/types/dto";
import type { Reserve } from "./amortization";
import type { Occurrence } from "./billingOccurrences";
import { toDateKey } from "../date/dateKey";
import { toCents } from "./money";

/**
 * Picks the USD→TWD rate for a day: the one published that day or, failing that, the most recent one before
 * it, so unpublished and future days use the latest known rate. Days before the first entry use the first.
 *
 * @param rates - Rates ordered by date; must not be empty.
 * @param dateKey - The day, "YYYY-MM-DD".
 * @returns TWD per 1 USD.
 */
export function rateOn(rates: ExchangeRateDto[], dateKey: string): number {
  let found = 0;
  let low = 0;
  let high = rates.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (rates[middle].date <= dateKey) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return rates[found].rate;
}

/**
 * Converts an amount to TWD with the rate of a day. A converted amount is rounded to a whole dollar, so the
 * converted rows of a list add up exactly to its converted total.
 *
 * @param currency - The amount's currency.
 * @param cents - The amount in cents.
 * @param rates - Rates ordered by date; must not be empty.
 * @param dateKey - The day whose rate applies, "YYYY-MM-DD".
 * @returns The TWD amount in whole cents.
 */
function toTwdCents(currency: Currency, cents: number, rates: ExchangeRateDto[], dateKey: string): number {
  switch (currency) {
    case "TWD":
      return cents;
    case "USD":
      return Math.round((cents * rateOn(rates, dateKey)) / 100) * 100;
  }
}

/**
 * Converts one charge to TWD with the rate of its charge day.
 *
 * @param occurrence - The charge.
 * @param rates - Rates ordered by date; must not be empty.
 * @returns The TWD amount in whole cents.
 */
export function occurrenceTwdCents({ date, subscription, amount }: Occurrence, rates: ExchangeRateDto[]): number {
  return toTwdCents(subscription.currency, toCents(amount), rates, date);
}

/**
 * Converts the rounded-up amount of one reserve to TWD with the rate of the charge it saves for, which for a
 * charge beyond the known rates is the latest one.
 *
 * @param reserve - The reserve.
 * @param rates - Rates ordered by date; must not be empty.
 * @returns The TWD amount in whole cents.
 */
export function reserveTwdCents({ subscription, chargeDate, reserveCents }: Reserve, rates: ExchangeRateDto[]): number {
  return toTwdCents(subscription.currency, reserveCents, rates, toDateKey(chargeDate));
}

/**
 * Adds charges up in TWD, converting each foreign charge with the rate of its own charge day.
 *
 * @param occurrences - The charges.
 * @param rates - Rates ordered by date; must not be empty.
 * @returns The TWD total in whole cents.
 */
export function sumTwdCents(occurrences: Occurrence[], rates: ExchangeRateDto[]): number {
  return occurrences.reduce((total, occurrence) => total + occurrenceTwdCents(occurrence, rates), 0);
}

/**
 * Tells whether any charge or reserve has to be converted, i.e. whether exchange rates are worth fetching.
 *
 * @param items - The charges or reserves.
 */
export function needsExchangeRate(items: readonly { subscription: { currency: Currency } }[]): boolean {
  return items.some(({ subscription }) => subscription.currency !== "TWD");
}

/**
 * Adds charges up in TWD when rates are available.
 *
 * @param occurrences - The charges.
 * @param rates - Rates ordered by date, or null when they are not loaded.
 * @returns The TWD total in whole cents, or null without rates.
 */
export function convertedTwdCents(occurrences: Occurrence[], rates: ExchangeRateDto[] | null): number | null {
  return rates === null ? null : sumTwdCents(occurrences, rates);
}

/**
 * Adds the rounded-up reserves up in TWD when rates are available.
 *
 * @param reserves - The reserves.
 * @param rates - Rates ordered by date, or null when they are not loaded.
 * @returns The TWD total in whole cents, or null without rates.
 */
export function convertedReserveTwdCents(reserves: Reserve[], rates: ExchangeRateDto[] | null): number | null {
  return rates === null ? null : reserves.reduce((total, reserve) => total + reserveTwdCents(reserve, rates), 0);
}
