"use client";

import { useId, useMemo } from "react";
import { useMonthCursor } from "@/hooks/useMonthCursor";
import type { LoadStatus } from "@/hooks/useSubscriptions";
import { monthReserves } from "@/lib/amortization";
import { monthOccurrences } from "@/lib/billingOccurrences";
import { yearTotals } from "@/lib/billingSummary";
import type { SubscriptionDto } from "@/types/dto";
import { BillingCalendar } from "./BillingCalendar";
import { LoadErrorNotice } from "./LoadErrorNotice";
import { MonthChargeList } from "./MonthChargeList";
import { MonthPicker } from "./MonthPicker";
import { MonthSummary } from "./MonthSummary";

interface CalendarSectionProps {
  items: SubscriptionDto[];
  status: LoadStatus;
  loadError: string | null;
  onRetry: () => void;
}

/**
 * Home screen calendar: month navigation, the month's charges on a calendar, a list of them, their totals and
 * the reserves for amortized yearly charges, with loading and error states.
 */
export function CalendarSection({ items, status, loadError, onRetry }: CalendarSectionProps) {
  const { today, cursor, setCursor } = useMonthCursor();
  const titleId = useId();
  const occurrences = useMemo(() => (cursor ? monthOccurrences(items, cursor) : []), [items, cursor]);
  const reserves = useMemo(() => (cursor ? monthReserves(items, cursor) : []), [items, cursor]);
  const year = cursor?.year;
  const yearTotal = useMemo(() => (year === undefined ? {} : yearTotals(items, year)), [items, year]);

  if (status === "error") return <LoadErrorNotice message={loadError} onRetry={onRetry} />;

  if (!today || !cursor || (status === "loading" && items.length === 0)) {
    return <div className="glass h-[28rem] animate-pulse rounded-[1.75rem]" aria-busy="true" aria-label="讀取中" />;
  }

  const isCurrentMonth = cursor.year === today.year && cursor.month === today.month;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby={titleId} className="glass rounded-[1.75rem] p-3 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <h2 id={titleId} className="font-num text-2xl">
              {cursor.year} 年 {cursor.month} 月
            </h2>
            <button type="button" className="btn btn-ghost" onClick={() => setCursor(null)} disabled={isCurrentMonth}>
              回到本月
            </button>
          </div>
          <MonthPicker value={cursor} current={today} onChange={setCursor} />
        </div>
        <BillingCalendar month={cursor} today={today} occurrences={occurrences} />
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <MonthChargeList occurrences={occurrences} />
        <MonthSummary occurrences={occurrences} reserves={reserves} year={cursor.year} yearTotal={yearTotal} />
      </div>
    </div>
  );
}
