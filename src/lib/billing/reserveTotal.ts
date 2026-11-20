import type { ExchangeRateDto } from "@/types/dto";
import { sumReserves, type Reserve } from "./amortization";
import { convertedReserveTwdCents } from "./currencyConversion";
import { currencyEntries } from "./money";
import { formatCents } from "../format/money";

/**
 * Formats the month's reserve total as one line: in TWD when exchange rates are available, otherwise the
 * per-currency amounts joined by " + ".
 *
 * @param reserves - The month's reserves.
 * @param rates - The year's exchange rates, or null when they are not loaded.
 * @returns E.g. "NT$ 1,500" or "NT$ 500 + US$ 31.00"; null without reserves.
 */
export function reserveTotalText(reserves: Reserve[], rates: ExchangeRateDto[] | null): string | null {
  if (reserves.length === 0) return null;
  const twdCents = convertedReserveTwdCents(reserves, rates);
  if (twdCents !== null) return formatCents("TWD", twdCents);
  return currencyEntries(sumReserves(reserves))
    .map(([currency, cents]) => formatCents(currency, cents))
    .join(" + ");
}
