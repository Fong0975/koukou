"use client";

import { useId } from "react";
import { useMonthCursor } from "@/hooks/useMonthCursor";
import { useMonthData } from "@/hooks/useMonthData";
import type { LoadStatus } from "@/hooks/useSubscriptions";
import type { SubscriptionDto } from "@/types/dto";
import { BillingCalendar } from "./BillingCalendar";
import { LoadErrorNotice } from "./LoadErrorNotice";
import { MonthChargeList } from "./MonthChargeList";
import { MonthExpiryList } from "./MonthExpiryList";
import { MonthPicker } from "./MonthPicker";
import { MonthReserveList } from "./MonthReserveList";
import { MonthSummary } from "./MonthSummary";

interface CalendarSectionProps {
  items: SubscriptionDto[];
  status: LoadStatus;
  loadError: string | null;
  onRetry: () => void;
}

/**
 * Home screen calendar: month navigation and the month's charges and contract expiries on a calendar, with
 * the expiring contracts and amortized reserves on the left below it and the charge list and totals on the
 * right (stacked in that order on narrow screens), plus loading and error states.
 */
export function CalendarSection({ items, status, loadError, onRetry }: CalendarSectionProps) {
  const { today, cursor, setCursor } = useMonthCursor();
  const titleId = useId();
  const { occurrences, reserves, expiries, yearTotal, yearTwdCents, rates } = useMonthData(items, cursor);

  if (status === "error") return <LoadErrorNotice message={loadError} onRetry={onRetry} />;

  if (!today || !cursor || (status === "loading" && items.length === 0)) {
    return <div className="glass h-[28rem] animate-pulse rounded-[1.75rem]" aria-busy="true" aria-label="讀取中" />;
  }

  const isCurrentMonth = cursor.year === today.year && cursor.month === today.month;

  return (
    <div className="flex flex-col gap-6">
      {/* Raised so a day's charge popup near the bottom overlaps the cards below instead of hiding behind them. */}
      <section aria-labelledby={titleId} className="glass relative z-10 rounded-[1.75rem] p-3 sm:p-6">
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
        <BillingCalendar month={cursor} today={today} occurrences={occurrences} expiries={expiries} />
      </section>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-6">
          <MonthExpiryList expiries={expiries} today={today} />
          <MonthReserveList reserves={reserves} />
        </div>
        <div className="flex flex-col gap-6">
          <MonthChargeList occurrences={occurrences} rates={rates} />
          <MonthSummary
            occurrences={occurrences}
            year={cursor.year}
            yearTotal={yearTotal}
            yearTwdCents={yearTwdCents}
            rates={rates}
          />
        </div>
      </div>
    </div>
  );
}
