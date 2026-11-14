import type { Reserve } from "@/lib/amortization";
import { reserveTwdCents } from "@/lib/currencyConversion";
import { formatReserve, formatReserveDetail } from "@/lib/format/subscription";
import type { ExchangeRateDto } from "@/types/dto";
import { ApproxTwdLine } from "./ApproxTwdLine";
import { MoneyListItem } from "./MoneyListItem";
import { ResponsiveSegments } from "./ResponsiveSegments";

interface MonthReserveItemProps {
  reserve: Reserve;
  /** USD→TWD rates for showing the approximate TWD of a foreign reserve, or null to omit it. */
  rates: ExchangeRateDto[] | null;
}

/**
 * One reserve in the month's reserve list: the subscription name over the charge year, installment and exact
 * monthly average (worded more briefly on narrow screens), with the rounded-up amount to set aside and, when it
 * is foreign, its approximate TWD.
 *
 * @param props.reserve - The reserve.
 * @param props.rates - The year's exchange rates.
 */
export function MonthReserveItem({ reserve, rates }: MonthReserveItemProps) {
  const { subscription, chargeDate, installment, reserveCents, averageCents } = reserve;
  const { amount, average } = formatReserve(subscription.currency, reserveCents, averageCents);

  return (
    <MoneyListItem
      title={subscription.name}
      subtitle={<ResponsiveSegments {...formatReserveDetail(chargeDate.year, installment, average)} />}
    >
      <p className="font-semibold">{amount}</p>
      <ApproxTwdLine
        currency={subscription.currency}
        rates={rates}
        toTwdCents={(loaded) => reserveTwdCents(reserve, loaded)}
      />
    </MoneyListItem>
  );
}
