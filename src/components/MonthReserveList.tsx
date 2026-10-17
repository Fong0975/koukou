import { useId } from "react";
import { sumReserves, type Reserve } from "@/lib/amortization";
import { formatReserve, formatReserveTerm } from "@/lib/format";
import { CoinListItem } from "./CoinListItem";
import { CurrencyAmounts } from "./CurrencyAmounts";

/**
 * Card listing what to set aside this month for upcoming amortized yearly charges, one row
 * per charge with the term it saves for, followed by the rounded-up subtotal. Renders nothing
 * without reserves.
 *
 * @param props.reserves - The month's reserves, already in display order.
 */
export function MonthReserveList({ reserves }: { reserves: Reserve[] }) {
  const titleId = useId();
  if (reserves.length === 0) return null;

  return (
    <section aria-labelledby={titleId} className="glass rounded-[1.75rem] p-5 sm:p-6">
      <h2 id={titleId} className="text-xl">
        預扣款項
      </h2>
      <p className="mt-1 text-sm text-ink-soft">年繳項目均攤到扣款前 12 個月，本月應先預留的金額</p>
      <ul aria-label="預扣款項" className="mt-2 flex flex-col divide-y divide-leaf-500/15">
        {reserves.map(({ key, subscription, chargeDate, reserveCents, averageCents }) => (
          <CoinListItem
            key={key}
            currency={subscription.currency}
            title={subscription.name}
            subtitle={formatReserveTerm(chargeDate)}
          >
            <p className="font-semibold">{formatReserve(subscription.currency, reserveCents, averageCents)}</p>
          </CoinListItem>
        ))}
      </ul>
      <div className="flex items-start justify-between gap-3 border-t border-leaf-500/15 pt-4">
        <span className="text-sm text-ink-soft">預留小計</span>
        <CurrencyAmounts totals={sumReserves(reserves)} className="items-end font-semibold" />
      </div>
    </section>
  );
}
