import type { CurrencyTotals } from "@/lib/billingSummary";
import { formatConvertedTotal } from "@/lib/format";
import { ConvertedTotalPopup } from "./ConvertedTotalPopup";
import { CurrencyAmounts } from "./CurrencyAmounts";
import type { PopupAlign } from "./HoverTapPopup";

interface ConvertedAmountsProps {
  totals: CurrencyTotals;
  /** The same totals converted to TWD, or null when no exchange rate is available. */
  twdCents: number | null;
  /**
   * Where the breakdown goes: "stacked" on its own line under the total, "inline" following it, or "popup"
   * behind an info icon, shown on hover or tap.
   */
  layout?: "stacked" | "inline" | "popup";
  /** Edge the "popup" layout's popup lines up with. */
  popupAlign?: PopupAlign;
  /** Extra classes, e.g. alignment or text size. */
  className?: string;
}

/**
 * Shows a total in TWD with the per-currency amounts it was converted from, read as
 * "NT$ 1,500 (NT$ 500, US$ 31.00)" or kept in a popup. Without a conversion it falls back to one line per currency.
 *
 * @param props.totals - Whole-cent totals per currency.
 * @param props.twdCents - The converted total, or null.
 * @param props.layout - Where the breakdown goes.
 * @param props.popupAlign - Edge the popup lines up with.
 * @param props.className - Extra classes for the wrapper.
 */
export function ConvertedAmounts({
  totals,
  twdCents,
  layout = "inline",
  popupAlign = "end",
  className = "items-end",
}: ConvertedAmountsProps) {
  if (twdCents === null) return <CurrencyAmounts totals={totals} className={className} />;

  const { total, breakdown } = formatConvertedTotal(twdCents, totals);
  if (layout === "popup" && breakdown.length > 0) {
    return <ConvertedTotalPopup total={total} breakdown={breakdown} align={popupAlign} className={className} />;
  }

  const direction = layout === "inline" ? "flex-wrap justify-end gap-x-1" : "flex-col";

  return (
    <span className={`flex font-num tabular-nums ${direction} ${className}`}>
      <span>{total}</span>
      {breakdown.length > 0 && (
        <span className="text-sm font-normal text-ink-soft">({breakdown.map(({ amount }) => amount).join(", ")})</span>
      )}
    </span>
  );
}
