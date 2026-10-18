import { useId } from "react";
import type { Occurrence } from "@/lib/billingOccurrences";
import { sumByCurrency, totalsByCategory, totalsByPaymentType, type CurrencyTotals } from "@/lib/billingSummary";
import { convertedTwdCents } from "@/lib/currencyConversion";
import type { ExchangeRateDto } from "@/types/dto";
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
 * Month totals, charge counts, subtotals per category and per payment method (sectioned by payment type), and the
 * year's total. With exchange rates, each total is shown in TWD followed by the per-currency amounts it was
 * converted from.
 *
 * @param props.occurrences - The month's charges.
 * @param props.year - The year the month belongs to.
 * @param props.yearTotal - That year's totals.
 * @param props.yearTwdCents - That year's total in TWD.
 * @param props.rates - That year's exchange rates.
 */
export function MonthSummary({ occurrences, year, yearTotal, yearTwdCents, rates }: MonthSummaryProps) {
  const titleId = useId();
  const subscriptionCount = new Set(occurrences.map((o) => o.subscription.id)).size;

  return (
    <section aria-labelledby={titleId} className="glass flex flex-col gap-5 rounded-[1.75rem] p-5 sm:p-6">
      <h2 id={titleId} className="text-xl">
        本月總結
      </h2>

      <div>
        <p className="text-sm text-ink-soft">本月總計</p>
        <ConvertedAmounts
          totals={sumByCurrency(occurrences)}
          twdCents={convertedTwdCents(occurrences, rates)}
          layout="stacked"
          className="items-start text-3xl font-semibold"
        />
        <p className="mt-1 text-sm text-ink-soft">
          共 {occurrences.length} 次扣款，來自 {subscriptionCount} 個項目
        </p>
      </div>

      {occurrences.length > 0 && (
        <>
          <GroupTotalsList title="依類別" groups={totalsByCategory(occurrences)} rates={rates} />
          <PaymentTypeTotalsList title="依付款方式" sections={totalsByPaymentType(occurrences)} rates={rates} />
        </>
      )}

      <div className="flex items-start justify-between gap-3 border-t border-leaf-500/15 pt-4">
        <span className="shrink-0 text-sm text-ink-soft">{year} 年度總計</span>
        <ConvertedAmounts totals={yearTotal} twdCents={yearTwdCents} className="items-end font-semibold" />
      </div>
    </section>
  );
}
