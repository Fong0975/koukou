import type { CurrencyTotals } from "@/lib/billingSummary";
import { formatConvertedTotal } from "@/lib/format";
import { CurrencyAmounts } from "./CurrencyAmounts";

interface ConvertedAmountsProps {
  totals: CurrencyTotals;
  /** The same totals converted to TWD, or null when no exchange rate is available. */
  twdCents: number | null;
  /** "stacked" puts the breakdown on its own line under the total; "inline" lets it follow the total. */
  layout?: "stacked" | "inline";
  /** Extra classes, e.g. alignment or text size. */
  className?: string;
}

/**
 * Shows a total in TWD followed by the per-currency amounts it was converted from, read as
 * "NT$ 1,500 (NT$ 500, US$ 31.00)". Without a conversion it falls back to one line per currency.
 *
 * @param props.totals - Whole-cent totals per currency.
 * @param props.twdCents - The converted total, or null.
 * @param props.layout - Where the breakdown goes.
 * @param props.className - Extra classes for the wrapper.
 */
export function ConvertedAmounts({
  totals,
  twdCents,
  layout = "inline",
  className = "items-end",
}: ConvertedAmountsProps) {
  if (twdCents === null) return <CurrencyAmounts totals={totals} className={className} />;

  const { total, breakdown } = formatConvertedTotal(twdCents, totals);
  const direction = layout === "stacked" ? "flex-col" : "flex-wrap justify-end gap-x-1";

  return (
    <span className={`flex font-num tabular-nums ${direction} ${className}`}>
      <span>{total}</span>
      {breakdown && <span className="text-sm font-normal text-ink-soft">({breakdown})</span>}
    </span>
  );
}
