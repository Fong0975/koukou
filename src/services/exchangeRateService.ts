import { toDateKey } from "@/lib/dateKey";
import type { ExchangeRateDto } from "@/types/dto";
import { fetchDailyRates, fetchLatestRate } from "./frankfurterClient";

/**
 * Lists the USD→TWD rates needed to convert one year's charges. The days that already have a rate get it;
 * later days fall back to the last entry, which is the latest published rate. A year entirely in the future
 * has no daily rates, so the latest rate stands in for all of it.
 *
 * @param year - The calendar year.
 * @returns At least one rate, ordered by date.
 * @throws UpstreamError when the rates cannot be fetched.
 */
export async function getYearRates(year: number): Promise<ExchangeRateDto[]> {
  const rates = await fetchDailyRates(toDateKey({ year, month: 1, day: 1 }), toDateKey({ year, month: 12, day: 31 }));
  if (rates.length === 0) return [await fetchLatestRate()];
  return [...rates].sort((a, b) => a.date.localeCompare(b.date));
}
