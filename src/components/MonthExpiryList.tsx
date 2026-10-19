import { useId } from "react";
import type { ContractExpiry } from "@/lib/contractExpiries";
import { formatChargeDate } from "@/lib/format";
import { CardFooter } from "./CardFooter";

/**
 * Card listing the contracts that end in the shown month, one row per subscription with its name and end date,
 * and a footer counting them. Without expiries it says so instead of disappearing.
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
        <>
          <ul aria-label="到期項目" className="mt-2 flex flex-col divide-y divide-leaf-500/15">
            {expiries.map(({ date, subscription }) => (
              <li key={subscription.id} className="py-3">
                <p className="break-words">{subscription.name}</p>
                <p className="text-sm text-ink-soft">{formatChargeDate(date)}</p>
              </li>
            ))}
          </ul>
          <CardFooter label="到期數量">
            <span className="font-num font-semibold tabular-nums">{expiries.length} 項</span>
          </CardFooter>
        </>
      )}
    </section>
  );
}
