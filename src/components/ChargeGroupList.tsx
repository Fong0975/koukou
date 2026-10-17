import { useId } from "react";
import type { SubscriptionCharges } from "@/lib/billingSummary";
import type { ChargeGroup, ChargeOrder } from "@/lib/chargeGroups";
import { convertedTwdCents } from "@/lib/currencyConversion";
import { formatDays } from "@/lib/format";
import type { ExchangeRateDto } from "@/types/dto";
import { ConvertedAmounts } from "./ConvertedAmounts";
import { IconLabel } from "./IconLabel";
import { MonthChargeItem } from "./MonthChargeItem";

interface ChargeGroupListProps {
  group: ChargeGroup;
  /** How the groups are formed; decides what each row's secondary line shows. */
  order: ChargeOrder;
  /** USD→TWD rates for converting the subtotal and foreign rows, or null to show them per currency. */
  rates: ExchangeRateDto[] | null;
}

/**
 * Line under a row's name that adds what the group heading does not already say: the category in a date
 * group, the charge days in a category group.
 */
function rowSubtitle({ subscription: { category }, days }: SubscriptionCharges, order: ChargeOrder) {
  return order === "category" ? formatDays(days) : <IconLabel icon={category.icon} label={category.name} />;
}

/**
 * One group of the month's charge list: a heading with the date or category and its subtotal, followed by
 * the group's charges.
 *
 * @param props.group - The group and its charges.
 * @param props.order - How the groups are formed.
 * @param props.rates - The year's exchange rates.
 */
export function ChargeGroupList({ group, order, rates }: ChargeGroupListProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <div className="flex items-start justify-between gap-3 border-b border-leaf-500/15 pb-1.5 text-sm">
        <h3 id={titleId} className="font-semibold text-leaf-800">
          <IconLabel icon={group.icon} label={group.label} />
        </h3>
        <ConvertedAmounts
          totals={group.totals}
          twdCents={convertedTwdCents(group.occurrences, rates)}
          className="items-end text-ink-soft"
        />
      </div>
      <ul aria-labelledby={titleId} className="flex flex-col divide-y divide-leaf-500/15">
        {group.charges.map((charge) => (
          <MonthChargeItem
            key={charge.subscription.id}
            charge={charge}
            subtitle={rowSubtitle(charge, order)}
            rates={rates}
          />
        ))}
      </ul>
    </section>
  );
}
