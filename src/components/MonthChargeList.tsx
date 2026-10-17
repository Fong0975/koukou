"use client";

import { useId, useMemo, useState } from "react";
import type { Occurrence } from "@/lib/billingOccurrences";
import { chargesBySubscription } from "@/lib/billingSummary";
import { CHARGE_ORDER_LABELS, sortCharges, type ChargeOrder } from "@/lib/chargeOrder";
import { sumTwdCents } from "@/lib/currencyConversion";
import { formatApproxTwd, formatCents, formatDays } from "@/lib/format";
import type { ExchangeRateDto } from "@/types/dto";
import { CoinListItem } from "./CoinListItem";
import { SegmentedControl } from "./SegmentedControl";

interface MonthChargeListProps {
  occurrences: Occurrence[];
  /** USD→TWD rates for showing the approximate TWD of foreign charges, or null to omit it. */
  rates: ExchangeRateDto[] | null;
}

/**
 * The month's charges, one row per subscription with its charge days and subtotal; foreign subtotals also show
 * their approximate TWD amount. A toggle in the header orders the rows by date or by category.
 *
 * @param props.occurrences - The month's charges.
 * @param props.rates - The year's exchange rates.
 */
export function MonthChargeList({ occurrences, rates }: MonthChargeListProps) {
  const titleId = useId();
  const [order, setOrder] = useState<ChargeOrder>("date");
  const charges = useMemo(() => sortCharges(chargesBySubscription(occurrences), order), [occurrences, order]);

  return (
    <section aria-labelledby={titleId} className="glass rounded-[1.75rem] p-5 sm:p-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 id={titleId} className="text-xl">
          本月扣款清單
        </h2>
        <SegmentedControl labels={CHARGE_ORDER_LABELS} value={order} onChange={setOrder} aria-label="排序方式" />
      </div>
      {charges.length === 0 ? (
        <p className="py-3 text-ink-soft">這個月沒有扣款。</p>
      ) : (
        <ul aria-label="本月扣款" className="flex flex-col divide-y divide-leaf-500/15">
          {charges.map(({ subscription, days, count, totalCents, unitCents, occurrences: charged }) => (
            <CoinListItem
              key={subscription.id}
              currency={subscription.currency}
              title={subscription.name}
              subtitle={
                <>
                  {subscription.category.icon && <span aria-hidden="true">{subscription.category.icon} </span>}
                  {subscription.category.name}・{formatDays(days)}
                </>
              }
            >
              <p className="font-semibold">{formatCents(subscription.currency, totalCents)}</p>
              {rates && subscription.currency !== "TWD" && (
                <p className="text-xs text-ink-soft">{formatApproxTwd(sumTwdCents(charged, rates))}</p>
              )}
              {count > 1 && (
                <p className="text-xs text-ink-soft">
                  {unitCents === null
                    ? `共 ${count} 次`
                    : `${formatCents(subscription.currency, unitCents)} × ${count}`}
                </p>
              )}
            </CoinListItem>
          ))}
        </ul>
      )}
    </section>
  );
}
