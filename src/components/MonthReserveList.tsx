import { sumReserves, type Reserve } from "@/lib/amortization";
import { formatReserve, formatReserveTerm } from "@/lib/format";
import { CardFooter } from "./CardFooter";
import { CoinListItem } from "./CoinListItem";
import { CollapsibleCard } from "./CollapsibleCard";
import { CurrencyAmounts } from "./CurrencyAmounts";

/**
 * Collapsible card listing what to set aside this month for upcoming amortized yearly charges, one row
 * per charge with the term it saves for and the exact average under the rounded-up amount,
 * with a footer holding the rounded-up subtotal per currency. Renders nothing without reserves.
 *
 * @param props.reserves - The month's reserves, already in display order.
 */
export function MonthReserveList({ reserves }: { reserves: Reserve[] }) {
  if (reserves.length === 0) return null;

  return (
    <CollapsibleCard
      title="預扣款項"
      header={<p className="mt-1 text-sm text-ink-soft">年繳項目均攤到扣款前 12 個月，本月應先預留的金額</p>}
      footer={
        <CardFooter label="預留小計">
          <CurrencyAmounts totals={sumReserves(reserves)} className="items-end font-semibold" />
        </CardFooter>
      }
    >
      <ul aria-label="預扣款項" className="flex flex-col divide-y divide-leaf-500/15">
        {reserves.map(({ key, subscription, chargeDate, reserveCents, averageCents }) => {
          const { amount, average } = formatReserve(subscription.currency, reserveCents, averageCents);
          return (
            <CoinListItem
              key={key}
              currency={subscription.currency}
              title={subscription.name}
              subtitle={formatReserveTerm(chargeDate)}
            >
              <p className="font-semibold">{amount}</p>
              {average && <p className="text-xs text-ink-soft">({average})</p>}
            </CoinListItem>
          );
        })}
      </ul>
    </CollapsibleCard>
  );
}
