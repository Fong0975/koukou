import type { Occurrence } from "@/lib/billingOccurrences";
import { sumByCurrency, totalsByCategory, totalsByPaymentType, type CurrencyTotals } from "@/lib/billingSummary";
import { convertedTwdCents } from "@/lib/currencyConversion";
import type { ExchangeRateDto } from "@/types/dto";
import { CardFooter } from "./CardFooter";
import { CollapsibleCard } from "./CollapsibleCard";
import { ConvertedAmounts } from "./ConvertedAmounts";
import { GroupTotalsList } from "./GroupTotalsList";
import { PaymentTypeTotalsList } from "./PaymentTypeTotalsList";

interface MonthSummaryProps {
  occurrences: Occurrence[];
  year: number;
  /** All charges of `year`, per currency. */
  yearTotal: CurrencyTotals;
  /** `yearTotal` converted to TWD, or null without exchange rates. */
  yearTwdCents: number | null;
  /** USD→TWD rates of `year`, or null to show every total per currency. */
  rates: ExchangeRateDto[] | null;
}

/**
 * Collapsible card of the month's totals and charge counts, with subtotals per category and per payment method
 * (sectioned by payment type) in its body and the year's total in its footer. With exchange rates, each total is
 * shown in TWD, with the per-currency amounts it was converted from in a popup behind an info icon.
 *
 * @param props.occurrences - The month's charges.
 * @param props.year - The year the month belongs to.
 * @param props.yearTotal - That year's totals.
 * @param props.yearTwdCents - That year's total in TWD.
 * @param props.rates - That year's exchange rates.
 */
export function MonthSummary({ occurrences, year, yearTotal, yearTwdCents, rates }: MonthSummaryProps) {
  const subscriptionCount = new Set(occurrences.map((o) => o.subscription.id)).size;

  return (
    <CollapsibleCard
      title="本月總結"
      header={
        <div className="mt-3">
          <p className="text-sm text-ink-soft">本月總計</p>
          <ConvertedAmounts
            totals={sumByCurrency(occurrences)}
            twdCents={convertedTwdCents(occurrences, rates)}
            layout="popup"
            popupAlign="start"
            className="items-start text-3xl font-semibold"
          />
        </div>
      }
      toggle={
        <span className="text-sm text-ink-soft">
          共 {occurrences.length} 次扣款，來自 {subscriptionCount} 個項目
        </span>
      }
      footer={
        <CardFooter label={`${year} 年度總計`}>
          <ConvertedAmounts
            totals={yearTotal}
            twdCents={yearTwdCents}
            layout="popup"
            className="items-end font-semibold"
          />
        </CardFooter>
      }
      collapsible={occurrences.length > 0}
    >
      {occurrences.length > 0 && (
        <div className="flex flex-col gap-5">
          <GroupTotalsList title="依類別" groups={totalsByCategory(occurrences)} rates={rates} />
          <PaymentTypeTotalsList title="依付款方式" sections={totalsByPaymentType(occurrences)} rates={rates} />
        </div>
      )}
    </CollapsibleCard>
  );
}
