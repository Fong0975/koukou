"use client";

import { useToday } from "@/hooks/useToday";
import { daysUntil } from "@/lib/contractExpiries";
import { formatFullDate } from "@/lib/format";

/**
 * One-line note of a subscription's contract end date, e.g. "合約到期 2027/03/31", turning into a warning
 * marked "已到期" once the date has passed. The warning waits for the browser's date, so it never shows
 * during server rendering.
 *
 * @param props.date - The contract's last day as "YYYY-MM-DD".
 */
export function ContractEndNote({ date }: { date: string }) {
  const today = useToday();
  const ended = today !== null && daysUntil(today, date) < 0;

  return (
    <p className={`mt-1 text-sm ${ended ? "text-berry" : "text-ink-soft"}`}>
      合約到期 <span className="font-num">{formatFullDate(date)}</span>
      {ended && "（已到期）"}
    </p>
  );
}
