import { useId } from "react";
import { amountOn } from "@/lib/amountPeriods";
import type { ContractExpiry } from "@/lib/contractExpiries";
import { formatAmount, formatChargeDate } from "@/lib/format";
import { CoinListItem } from "./CoinListItem";

/**
 * Card listing the contracts that end in the shown month, one row per subscription with its end date and the
 * amount it last charges. Without expiries it says so instead of disappearing.
 *
 * @param props.expiries - The month's contract expiries, already in display order.
 */
export function MonthExpiryList({ expiries }: { expiries: ContractExpiry[] }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="glass rounded-[1.75rem] p-5 sm:p-6">
      <h2 id={titleId} className="text-xl">
        本月到期
      </h2>
      {expiries.length === 0 ? (
        <p className="py-3 text-ink-soft">這個月沒有到期的合約。</p>
      ) : (
        <ul aria-label="到期項目" className="mt-2 flex flex-col divide-y divide-leaf-500/15">
          {expiries.map(({ date, subscription }) => {
            const { prefix, value } = formatAmount(subscription.currency, amountOn(subscription, date));
            return (
              <CoinListItem
                key={subscription.id}
                currency={subscription.currency}
                title={subscription.name}
                subtitle={formatChargeDate(date)}
              >
                <p className="font-semibold">
                  {prefix} {value}
                </p>
              </CoinListItem>
            );
          })}
        </ul>
      )}
    </section>
  );
}
