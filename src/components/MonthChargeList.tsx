"use client";

import { useMemo, useState } from "react";
import type { Occurrence } from "@/lib/billingOccurrences";
import { sumByCurrency } from "@/lib/billingSummary";
import { CHARGE_ORDER_LABELS, chargeGroups, type ChargeOrder } from "@/lib/chargeGroups";
import { convertedTwdCents } from "@/lib/currencyConversion";
import type { ExchangeRateDto } from "@/types/dto";
import { CardFooter } from "./CardFooter";
import { ChargeGroupList } from "./ChargeGroupList";
import { CollapsibleCard } from "./CollapsibleCard";
import { ConvertedAmounts } from "./ConvertedAmounts";
import { SegmentedControl } from "./SegmentedControl";

interface MonthChargeListProps {
  occurrences: Occurrence[];
  /** USD→TWD rates for showing the approximate TWD of foreign charges, or null to omit it. */
  rates: ExchangeRateDto[] | null;
}

/**
 * Collapsible card of the month's charges, grouped by charge date or by category as picked at the top of the
 * body. Each group has a heading with its subtotal, followed by one row per subscription; only dates or
 * categories with charges are shown. A footer holds the month's subtotal, in TWD when exchange rates are
 * available.
 *
 * @param props.occurrences - The month's charges.
 * @param props.rates - The year's exchange rates.
 */
export function MonthChargeList({ occurrences, rates }: MonthChargeListProps) {
  const [order, setOrder] = useState<ChargeOrder>("date");
  const groups = useMemo(() => chargeGroups(occurrences, order), [occurrences, order]);
  const isEmpty = groups.length === 0;

  return (
    <CollapsibleCard
      title="本月扣款清單"
      collapsible={!isEmpty}
      footer={
        !isEmpty && (
          <CardFooter label="扣款小計">
            <ConvertedAmounts
              totals={sumByCurrency(occurrences)}
              twdCents={convertedTwdCents(occurrences, rates)}
              layout="popup"
              className="items-end font-semibold"
            />
          </CardFooter>
        )
      }
    >
      {isEmpty ? (
        <p className="py-3 text-ink-soft">這個月沒有扣款。</p>
      ) : (
        <div className="flex flex-col gap-5">
          <SegmentedControl
            labels={CHARGE_ORDER_LABELS}
            value={order}
            onChange={setOrder}
            aria-label="排序方式"
            className="self-end"
          />
          {groups.map((group) => (
            <ChargeGroupList key={group.key} group={group} order={order} rates={rates} />
          ))}
        </div>
      )}
    </CollapsibleCard>
  );
}
