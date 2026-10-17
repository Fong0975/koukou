import type { ReactNode } from "react";
import type { SubscriptionCharges } from "@/lib/billingSummary";
import { sumTwdCents } from "@/lib/currencyConversion";
import { formatApproxTwd, formatCents } from "@/lib/format";
import type { ExchangeRateDto } from "@/types/dto";
import { CoinListItem } from "./CoinListItem";

interface MonthChargeItemProps {
  charge: SubscriptionCharges;
  /** Secondary line under the name, e.g. the category or the charge days. */
  subtitle: ReactNode;
  /** USD→TWD rates for showing the approximate TWD of a foreign charge, or null to omit it. */
  rates: ExchangeRateDto[] | null;
}

/**
 * One subscription's charges in the month's charge list: its subtotal, the approximate TWD amount when it is
 * foreign, and the unit price or charge count when it was charged more than once.
 *
 * @param props.charge - The subscription's charges.
 * @param props.subtitle - Secondary line under the name.
 * @param props.rates - The year's exchange rates.
 */
export function MonthChargeItem({ charge, subtitle, rates }: MonthChargeItemProps) {
  const { subscription, count, totalCents, unitCents, occurrences } = charge;

  return (
    <CoinListItem currency={subscription.currency} title={subscription.name} subtitle={subtitle}>
      <p className="font-semibold">{formatCents(subscription.currency, totalCents)}</p>
      {rates && subscription.currency !== "TWD" && (
        <p className="text-xs text-ink-soft">{formatApproxTwd(sumTwdCents(occurrences, rates))}</p>
      )}
      {count > 1 && (
        <p className="text-xs text-ink-soft">
          {unitCents === null ? `共 ${count} 次` : `${formatCents(subscription.currency, unitCents)} × ${count}`}
        </p>
      )}
    </CoinListItem>
  );
}
