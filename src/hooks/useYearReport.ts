"use client";

import { useMemo } from "react";
import { yearOccurrences } from "@/lib/billingOccurrences";
import { totalsByCategory, totalsByPaymentMethod } from "@/lib/billingSummary";
import { needsExchangeRate } from "@/lib/currencyConversion";
import { groupShares, monthlyTotals, subscriptionRanking, yearHighlights } from "@/lib/yearReport";
import type { SubscriptionDto } from "@/types/dto";
import { useYearRates } from "./useYearRates";

/**
 * Derives the annual report of one year: its headline figures, monthly totals, distributions per category and
 * payment method, and subscription ranking. When the year has foreign charges, its exchange rates are fetched
 * so everything can be compared in TWD.
 *
 * @param items - All subscriptions.
 * @param year - The reported year.
 * @returns The report; TWD figures are null while the rates load.
 */
export function useYearReport(items: SubscriptionDto[], year: number) {
  const occurrences = useMemo(() => yearOccurrences(items, year), [items, year]);
  const needsRates = useMemo(() => needsExchangeRate(occurrences), [occurrences]);
  const rates = useYearRates(year, needsRates);

  return useMemo(() => {
    const months = monthlyTotals(occurrences, rates);
    return {
      highlights: yearHighlights(months, occurrences),
      months,
      byCategory: groupShares(totalsByCategory(occurrences), rates),
      byPaymentMethod: groupShares(totalsByPaymentMethod(occurrences), rates),
      ranking: subscriptionRanking(occurrences, rates),
      rates,
    };
  }, [occurrences, rates]);
}
