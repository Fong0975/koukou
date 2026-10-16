"use client";

import { useId, useMemo } from "react";
import { useMonthCursor } from "@/hooks/useMonthCursor";
import type { LoadStatus } from "@/hooks/useSubscriptions";
import { monthOccurrences } from "@/lib/billingOccurrences";
import type { SubscriptionDto } from "@/types/dto";
import { BillingCalendar } from "./BillingCalendar";
import { LoadErrorNotice } from "./LoadErrorNotice";
import { MonthPicker } from "./MonthPicker";

interface CalendarSectionProps {
  items: SubscriptionDto[];
  status: LoadStatus;
  loadError: string | null;
  onRetry: () => void;
}

/**
 * Home screen calendar: month navigation plus the month's charges, with loading and error states.
 */
export function CalendarSection({ items, status, loadError, onRetry }: CalendarSectionProps) {
  const { today, cursor, setCursor } = useMonthCursor();
  const titleId = useId();
  const occurrences = useMemo(() => (cursor ? monthOccurrences(items, cursor) : []), [items, cursor]);

  if (status === "error") return <LoadErrorNotice message={loadError} onRetry={onRetry} />;

  if (!today || !cursor || (status === "loading" && items.length === 0)) {
    return <div className="glass h-[28rem] animate-pulse rounded-[1.75rem]" aria-busy="true" aria-label="讀取中" />;
  }

  return (
    <section aria-labelledby={titleId} className="glass rounded-[1.75rem] p-3 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 id={titleId} className="font-num text-2xl">
          {cursor.year} 年 {cursor.month} 月
        </h2>
        <MonthPicker value={cursor} current={today} onChange={setCursor} />
      </div>
      <BillingCalendar month={cursor} today={today} occurrences={occurrences} />
    </section>
  );
}
