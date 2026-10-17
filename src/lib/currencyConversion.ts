import type { ExchangeRateDto } from "@/types/dto";
import type { Occurrence } from "./billingOccurrences";
import { toCents } from "./billingSummary";

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
 * Converts one charge to TWD with the rate of its charge day. A converted charge is rounded to a whole dollar,
 * so the converted rows of a list add up exactly to its converted total.
 *
 * @param occurrence - The charge.
 * @param rates - Rates ordered by date; must not be empty.
 * @returns The TWD amount in whole cents.
 */
export function occurrenceTwdCents({ date, subscription, amount }: Occurrence, rates: ExchangeRateDto[]): number {
  const cents = toCents(amount);
  switch (subscription.currency) {
    case "TWD":
      return cents;
    case "USD":
      return Math.round((cents * rateOn(rates, date)) / 100) * 100;
  }
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
 * Tells whether any charge has to be converted, i.e. whether exchange rates are worth fetching.
 *
 * @param occurrences - The charges.
 */
export function needsExchangeRate(occurrences: Occurrence[]): boolean {
  return occurrences.some(({ subscription }) => subscription.currency !== "TWD");
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
