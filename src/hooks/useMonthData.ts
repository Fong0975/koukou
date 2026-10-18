"use client";

import { useMemo } from "react";
import { monthReserves } from "@/lib/amortization";
import { monthOccurrences, yearOccurrences } from "@/lib/billingOccurrences";
import { sumByCurrency } from "@/lib/billingSummary";
import type { YearMonth } from "@/lib/calendarMonth";
import { monthContractExpiries } from "@/lib/contractExpiries";
import { convertedTwdCents, needsExchangeRate } from "@/lib/currencyConversion";
import type { SubscriptionDto } from "@/types/dto";
import { useYearRates } from "./useYearRates";

/**
 * Derives everything the home calendar shows for one month: its charges, contract expiries and amortized
 * reserves, plus the totals of its year. When that year has foreign charges, its exchange rates are fetched
 * so the totals can be converted to TWD.
 *
 * @param items - All subscriptions.
 * @param cursor - The shown month, or null before the client knows the date (everything is then empty).
 * @returns The month's lists, the year's per-currency and TWD totals, and the year's rates (null until loaded
 *   or when not needed).
 */
export function useMonthData(items: SubscriptionDto[], cursor: YearMonth | null) {
  const occurrences = useMemo(() => (cursor ? monthOccurrences(items, cursor) : []), [items, cursor]);
  const reserves = useMemo(() => (cursor ? monthReserves(items, cursor) : []), [items, cursor]);
  const expiries = useMemo(() => (cursor ? monthContractExpiries(items, cursor) : []), [items, cursor]);
  const year = cursor?.year;
  const yearCharges = useMemo(() => (year === undefined ? [] : yearOccurrences(items, year)), [items, year]);
  const yearTotal = useMemo(() => sumByCurrency(yearCharges), [yearCharges]);
  const needsRates = useMemo(() => needsExchangeRate(yearCharges), [yearCharges]);
  const rates = useYearRates(year, needsRates);
  const yearTwdCents = useMemo(() => convertedTwdCents(yearCharges, rates), [yearCharges, rates]);

  return { occurrences, reserves, expiries, yearTotal, yearTwdCents, rates };
}
