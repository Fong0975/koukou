import type { ExchangeRateDto } from "@/types/dto";
import { apiRequest } from "./apiClient";

/** How long fetched rates are reused; the server adds a new day's rate at most once a day. */
const CACHE_TTL_MS = 10 * 60 * 1000;

const cache = new Map<number, { fetchedAt: number; rates: Promise<ExchangeRateDto[]> }>();

/**
 * Fetches the USD→TWD rates of one year, sharing one request between every caller that asks for the same
 * year within a few minutes, e.g. the calendar and the annual report. A failed request is not kept.
 *
 * @param year - The year.
 * @returns The year's rates ordered by date.
 * @throws ApiClientError when the request fails.
 */
export function fetchYearRates(year: number): Promise<ExchangeRateDto[]> {
  const cached = cache.get(year);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.rates;

  const rates = apiRequest<ExchangeRateDto[]>(`/api/exchange-rates?year=${year}`);
  cache.set(year, { fetchedAt: Date.now(), rates });
  rates.catch(() => {
    if (cache.get(year)?.rates === rates) cache.delete(year);
  });
  return rates;
}

/** Forgets every cached year, so the next {@link fetchYearRates} calls request again; used by tests. */
export function clearYearRatesCache(): void {
  cache.clear();
}
