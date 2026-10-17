"use client";

import { useId, useMemo, useState } from "react";
import type { Occurrence } from "@/lib/billingOccurrences";
import { CHARGE_ORDER_LABELS, chargeGroups, type ChargeOrder } from "@/lib/chargeGroups";
import type { ExchangeRateDto } from "@/types/dto";
import { ChargeGroupList } from "./ChargeGroupList";
import { SegmentedControl } from "./SegmentedControl";

interface MonthChargeListProps {
  occurrences: Occurrence[];
  /** USD→TWD rates for showing the approximate TWD of foreign charges, or null to omit it. */
  rates: ExchangeRateDto[] | null;
}

/**
 * The month's charges, grouped by charge date or by category as picked in the header. Each group has a
 * heading with its subtotal, followed by one row per subscription; only dates or categories with charges
 * are shown.
 *
 * @param props.occurrences - The month's charges.
 * @param props.rates - The year's exchange rates.
 */
export function MonthChargeList({ occurrences, rates }: MonthChargeListProps) {
  const titleId = useId();
  const [order, setOrder] = useState<ChargeOrder>("date");
  const groups = useMemo(() => chargeGroups(occurrences, order), [occurrences, order]);

  return (
    <section aria-labelledby={titleId} className="glass rounded-[1.75rem] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={titleId} className="text-xl">
          本月扣款清單
        </h2>
        <SegmentedControl labels={CHARGE_ORDER_LABELS} value={order} onChange={setOrder} aria-label="排序方式" />
      </div>
      {groups.length === 0 ? (
        <p className="py-3 text-ink-soft">這個月沒有扣款。</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <ChargeGroupList key={group.key} group={group} order={order} rates={rates} />
          ))}
        </div>
      )}
    </section>
  );
}
