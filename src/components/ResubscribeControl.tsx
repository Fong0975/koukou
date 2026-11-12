"use client";

import { useState } from "react";
import { useReportUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { addDays, isDateKey, todayKey } from "@/lib/dateKey";

interface ResubscribeControlProps {
  /** The subscription's end date as "YYYY-MM-DD", or "" without one. */
  endDate: string;
  /** Receives the first day it charges again, always after `endDate`. */
  onResubscribe: (resumeDate: string) => void;
}

/**
 * Lets an ended subscription charge again from a picked day. Shown only once the end date has passed; a
 * resume date picked but not applied yet counts as an unsaved change of the dialog around it.
 */
export function ResubscribeControl({ endDate, onResubscribe }: ResubscribeControlProps) {
  const [resumeDate, setResumeDate] = useState("");
  const ended = isDateKey(endDate) && endDate < todayKey();
  useReportUnsavedChanges(ended && resumeDate !== "");
  if (!ended) return null;

  const valid = isDateKey(resumeDate) && resumeDate > endDate;
  const apply = () => {
    onResubscribe(resumeDate);
    setResumeDate("");
  };

  return (
    <div className="mt-2 rounded-2xl border border-dashed border-leaf-500/35 bg-leaf-50/70 p-3">
      <p className="text-sm text-ink-soft">已過到期日，不再扣款。要重新訂閱，請選擇恢復扣款的日期：</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="date"
          className="field w-auto font-num"
          aria-label="恢復扣款日"
          min={addDays(endDate, 1)}
          value={resumeDate}
          onChange={(event) => setResumeDate(event.target.value)}
        />
        <button type="button" className="btn btn-soft" disabled={!valid} onClick={apply}>
          重新訂閱
        </button>
      </div>
    </div>
  );
}
