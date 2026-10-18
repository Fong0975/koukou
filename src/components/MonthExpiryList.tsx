import { useId } from "react";
import { amountOn } from "@/lib/amountPeriods";
import type { CalendarDate } from "@/lib/calendarMonth";
import { daysUntil, type ContractExpiry } from "@/lib/contractExpiries";
import { formatAmount, formatChargeDate, formatContractRemaining } from "@/lib/format";
import { CoinListItem } from "./CoinListItem";

interface MonthExpiryListProps {
  expiries: ContractExpiry[];
  today: CalendarDate;
}

/**
 * Card listing the contracts that end in the shown month, one row per subscription with its end date, how far
 * away that is and the amount it last charges. Days left turn red once the contract ends today or has ended.
 * Without expiries it says so instead of disappearing.
 *
 * @param props.expiries - The month's contract expiries, already in display order.
 * @param props.today - Today's date, for counting the days left.
 */
export function MonthExpiryList({ expiries, today }: MonthExpiryListProps) {
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
            const days = daysUntil(today, date);
            const { prefix, value } = formatAmount(subscription.currency, amountOn(subscription, date));
            return (
              <CoinListItem
                key={subscription.id}
                currency={subscription.currency}
                title={subscription.name}
                subtitle={
                  <>
                    {`${formatChargeDate(date)} · `}
                    <span className={days <= 0 ? "text-berry" : undefined}>{formatContractRemaining(days)}</span>
                  </>
                }
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
