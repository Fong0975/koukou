"use client";

import { useToday } from "@/hooks/useToday";
import { daysUntil } from "@/lib/contractExpiries";
import { formatContractRemaining, formatFullDate } from "@/lib/format";

/**
 * One-line note of a subscription's contract end date with the days left, e.g. "合約到期 2027/03/31（剩 164 天）",
 * turning into a warning once the contract ends today or has ended. The days left wait for the browser's date,
 * so only the date shows during server rendering.
 *
 * @param props.date - The contract's last day as "YYYY-MM-DD".
 */
export function ContractEndNote({ date }: { date: string }) {
  const today = useToday();
  const days = today === null ? null : daysUntil(today, date);
  const ending = days !== null && days <= 0;

  return (
    <p className={`mt-1 text-sm ${ending ? "text-berry" : "text-ink-soft"}`}>
      合約到期 <span className="font-num">{formatFullDate(date)}</span>
      {days !== null && `（${formatContractRemaining(days)}）`}
    </p>
  );
}
