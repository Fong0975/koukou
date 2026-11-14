"use client";

import { useMemo } from "react";
import { monthReserves } from "@/lib/amortization";
import { yearOccurrences } from "@/lib/billingOccurrences";
import type { YearMonth } from "@/lib/calendarMonth";
import { monthContractExpiries } from "@/lib/contractExpiries";
import { convertedTwdCents, needsExchangeRate } from "@/lib/currencyConversion";
import { dateKeyToYearMonth } from "@/lib/dateKey";
import { sumByCurrency } from "@/lib/money";
import type { SubscriptionDto } from "@/types/dto";
import { useYearRates } from "./useYearRates";

/**
 * Derives everything the home calendar shows for one month: its charges, contract expiries and amortized
 * reserves, plus the totals of its year. When that year has foreign charges or the month foreign reserves,
 * the year's exchange rates are fetched so the amounts can be converted to TWD.
 *
 * @param items - All subscriptions.
 * @param cursor - The shown month, or null before the client knows the date (everything is then empty).
 * @returns The month's lists, the year's per-currency and TWD totals, and the year's rates (null until loaded
 *   or when not needed).
 */
export function useMonthData(items: SubscriptionDto[], cursor: YearMonth | null) {
  const year = cursor?.year;
  const yearCharges = useMemo(() => (year === undefined ? [] : yearOccurrences(items, year)), [items, year]);
  // The year's charges are already worked out for its totals, so the month's are picked from them.
  const occurrences = useMemo(
    () =>
      cursor ? yearCharges.filter((occurrence) => dateKeyToYearMonth(occurrence.date).month === cursor.month) : [],
    [yearCharges, cursor],
  );
  const reserves = useMemo(() => (cursor ? monthReserves(items, cursor) : []), [items, cursor]);
  const expiries = useMemo(() => (cursor ? monthContractExpiries(items, cursor) : []), [items, cursor]);
  const yearTotal = useMemo(() => sumByCurrency(yearCharges), [yearCharges]);
  const needsRates = useMemo(
    () => needsExchangeRate(yearCharges) || needsExchangeRate(reserves),
    [yearCharges, reserves],
  );
  const rates = useYearRates(year, needsRates);
  const yearTwdCents = useMemo(() => convertedTwdCents(yearCharges, rates), [yearCharges, rates]);

  return { occurrences, reserves, expiries, yearTotal, yearTwdCents, rates };
}
