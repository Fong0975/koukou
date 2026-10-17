import { sumReserves, type Reserve } from "@/lib/amortization";
import { formatReserve, formatReserveTerm } from "@/lib/format";
import { CurrencyAmounts } from "./CurrencyAmounts";

const TITLE = "預扣款項";

/**
 * What to set aside this month for upcoming yearly charges, one row per charge with the
 * term it saves for, followed by the rounded-up subtotal. Renders nothing without reserves.
 *
 * @param props.reserves - The month's reserves, already in display order.
 */
export function ReserveList({ reserves }: { reserves: Reserve[] }) {
  if (reserves.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm text-ink-soft">{TITLE}</h3>
      <ul aria-label={TITLE} className="flex flex-col gap-1.5">
        {reserves.map(({ key, subscription, chargeDate, reserveCents, averageCents }) => (
          <li key={key} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block truncate">{subscription.name}</span>
              <span className="block truncate text-xs text-ink-soft">{formatReserveTerm(chargeDate)}</span>
            </span>
            <span className="shrink-0 font-num tabular-nums">
              {formatReserve(subscription.currency, reserveCents, averageCents)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-start justify-between gap-3 border-t border-leaf-500/15 pt-2 text-sm">
        <span className="text-ink-soft">預留小計</span>
        <CurrencyAmounts totals={sumReserves(reserves)} className="items-end font-semibold" />
      </div>
    </div>
  );
}
