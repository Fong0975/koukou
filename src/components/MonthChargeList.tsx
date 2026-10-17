import { useId } from "react";
import type { Occurrence } from "@/lib/billingOccurrences";
import { chargesBySubscription } from "@/lib/billingSummary";
import { formatCents, formatDays } from "@/lib/format";
import { CoinMark } from "./CoinMark";

/**
 * The month's charges, one row per subscription with its charge days and subtotal.
 *
 * @param props.occurrences - The month's charges.
 */
export function MonthChargeList({ occurrences }: { occurrences: Occurrence[] }) {
  const titleId = useId();
  const charges = chargesBySubscription(occurrences);

  return (
    <section aria-labelledby={titleId} className="glass rounded-[1.75rem] p-5 sm:p-6">
      <h2 id={titleId} className="mb-2 text-xl">
        本月扣款清單
      </h2>
      {charges.length === 0 ? (
        <p className="py-3 text-ink-soft">這個月沒有扣款。</p>
      ) : (
        <ul aria-label="本月扣款" className="flex flex-col divide-y divide-leaf-500/15">
          {charges.map(({ subscription, days, count, totalCents, unitCents }) => (
            <li key={subscription.id} className="flex items-center gap-3 py-3">
              <CoinMark currency={subscription.currency} />
              <div className="min-w-0 flex-1">
                <p className="truncate">{subscription.name}</p>
                <p className="truncate text-sm text-ink-soft">
                  {subscription.category.icon && <span aria-hidden="true">{subscription.category.icon} </span>}
                  {subscription.category.name}・{formatDays(days)}
                </p>
              </div>
              <div className="shrink-0 text-right font-num tabular-nums">
                <p className="font-semibold">{formatCents(subscription.currency, totalCents)}</p>
                {count > 1 && (
                  <p className="text-xs text-ink-soft">
                    {unitCents === null
                      ? `共 ${count} 次`
                      : `${formatCents(subscription.currency, unitCents)} × ${count}`}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
