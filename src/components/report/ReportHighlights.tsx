import type { ReactNode } from "react";
import { formatCents } from "@/lib/format";
import type { MonthTotal, YearHighlights } from "@/lib/yearReport";
import { ConvertedAmounts } from "../ConvertedAmounts";

/** Shown in place of a TWD figure that is not known yet. */
const UNKNOWN = "—";

/**
 * Describes a month with its TWD total, e.g. "5 月・NT$ 1,000".
 *
 * @param month - The month, or null when there is none to show.
 */
function monthLabel(month: MonthTotal | null): string {
  return month === null || month.twdCents === null
    ? UNKNOWN
    : `${month.month} 月・${formatCents("TWD", month.twdCents)}`;
}

/**
 * Tiles of the year's headline figures: total, monthly average, charge and subscription counts, and the most and
 * least expensive months.
 *
 * @param props.highlights - The year's figures.
 */
export function ReportHighlights({ highlights }: { highlights: YearHighlights }) {
  const { totals, twdCents, monthlyAverageTwdCents, chargeCount, subscriptionCount, highest, lowest } = highlights;
  const tiles: { label: string; value: ReactNode }[] = [
    {
      label: "年度總計",
      value: (
        <ConvertedAmounts
          totals={totals}
          twdCents={twdCents}
          layout="popup"
          popupAlign="start"
          className="items-start"
        />
      ),
    },
    {
      label: "每月平均",
      value: monthlyAverageTwdCents === null ? UNKNOWN : formatCents("TWD", monthlyAverageTwdCents),
    },
    { label: "扣款次數", value: `${chargeCount} 次` },
    { label: "扣款項目", value: `${subscriptionCount} 個` },
    { label: "最高月份", value: monthLabel(highest) },
    { label: "最低月份", value: monthLabel(lowest) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map(({ label, value }) => (
        <div key={label} className="report-panel px-4 py-3">
          <dt className="text-xs text-ink-soft">{label}</dt>
          <dd className="mt-1 font-num text-lg font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
