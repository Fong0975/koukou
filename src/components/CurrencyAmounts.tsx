import { currencyEntries, type CurrencyTotals } from "@/lib/billingSummary";
import { formatCents } from "@/lib/format";

interface CurrencyAmountsProps {
  totals: CurrencyTotals;
  /** Extra classes, e.g. alignment or text size. */
  className?: string;
}

/**
 * Stacks one amount per currency, since totals are never converted between currencies.
 * An empty total reads as "NT$ 0".
 *
 * @param props.totals - Whole-cent totals per currency.
 * @param props.className - Extra classes for the wrapper.
 */
export function CurrencyAmounts({ totals, className = "items-end" }: CurrencyAmountsProps) {
  const entries = currencyEntries(totals);
  const lines = entries.length > 0 ? entries : currencyEntries({ TWD: 0 });

  return (
    <span className={`flex flex-col font-num tabular-nums ${className}`}>
      {lines.map(([currency, cents]) => (
        <span key={currency}>{formatCents(currency, cents)}</span>
      ))}
    </span>
  );
}
