"use client";

import type { YearMonth } from "@/lib/calendarMonth";
import { MonthPicker } from "./MonthPicker";

interface MonthToolbarProps {
  titleId: string;
  cursor: YearMonth;
  today: YearMonth;
  onChange: (next: YearMonth | null) => void;
}

/**
 * Row showing the visible month's title, the month picker and a button that jumps back to the current month.
 * It has no panel of its own: it is rendered inside the sticky header's glass panel so both read as one block.
 */
export function MonthToolbar({ titleId, cursor, today, onChange }: MonthToolbarProps) {
  const isCurrentMonth = cursor.year === today.year && cursor.month === today.month;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-1 pb-2.5 sm:px-7">
      <div className="flex items-center gap-3">
        <h2 id={titleId} className="font-num text-lg font-semibold">
          {cursor.year} 年 {cursor.month} 月
        </h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)} disabled={isCurrentMonth}>
          回到本月
        </button>
      </div>
      <MonthPicker value={cursor} current={today} onChange={onChange} />
    </div>
  );
}
