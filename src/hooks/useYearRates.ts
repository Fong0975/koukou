"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { ExchangeRateDto } from "@/types/dto";

/** Rates of the year they were fetched for. */
interface LoadedRates {
  year: number;
  rates: ExchangeRateDto[];
}

/**
 * Fetches the USD→TWD rates of one year when its charges need converting. Only the latest year is kept, so
 * switching back to a year fetches it again. A failed fetch is logged and leaves the rates unavailable.
 *
 * @param year - The year, or undefined before it is known.
 * @param enabled - Whether that year has charges to convert; nothing is fetched otherwise.
 * @returns The year's rates ordered by date, or null while unneeded, loading or unavailable.
 */
export function useYearRates(year: number | undefined, enabled: boolean): ExchangeRateDto[] | null {
  const [loaded, setLoaded] = useState<LoadedRates | null>(null);
  const isLoaded = loaded !== null && loaded.year === year;
  const shouldFetch = enabled && year !== undefined && !isLoaded;

  useEffect(() => {
    if (!shouldFetch || year === undefined) return;
    let cancelled = false;
    apiRequest<ExchangeRateDto[]>(`/api/exchange-rates?year=${year}`)
      .then((rates) => {
        if (!cancelled) setLoaded({ year, rates });
      })
      .catch((error) => console.error("[koukou] Failed to load exchange rates:", error));
    return () => {
      cancelled = true;
    };
  }, [shouldFetch, year]);

  return enabled && isLoaded ? loaded.rates : null;
}
