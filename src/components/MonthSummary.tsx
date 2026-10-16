import { useId } from "react";
import type { Occurrence } from "@/lib/billingOccurrences";
import { sumByCurrency, totalsByCategory, totalsByPaymentMethod, type CurrencyTotals } from "@/lib/billingSummary";
import { CurrencyAmounts } from "./CurrencyAmounts";
import { GroupTotalsList } from "./GroupTotalsList";

interface MonthSummaryProps {
  occurrences: Occurrence[];
  year: number;
  /** All charges of `year`, per currency. */
  yearTotal: CurrencyTotals;
}

/**
 * Month totals per currency, charge counts, subtotals per category and payment method, and the year's total.
 *
 * @param props.occurrences - The month's charges.
 * @param props.year - The year the month belongs to.
 * @param props.yearTotal - That year's totals.
 */
export function MonthSummary({ occurrences, year, yearTotal }: MonthSummaryProps) {
  const titleId = useId();
  const subscriptionCount = new Set(occurrences.map((o) => o.subscription.id)).size;

  return (
    <section aria-labelledby={titleId} className="glass flex flex-col gap-5 rounded-[1.75rem] p-5 sm:p-6">
      <h2 id={titleId} className="text-xl">
        本月總結
      </h2>

      <div>
        <p className="text-sm text-ink-soft">本月總計</p>
        <CurrencyAmounts totals={sumByCurrency(occurrences)} className="items-start text-3xl font-semibold" />
        <p className="mt-1 text-sm text-ink-soft">
          共 {occurrences.length} 次扣款，來自 {subscriptionCount} 個項目
        </p>
      </div>

      {occurrences.length > 0 && (
        <>
          <GroupTotalsList title="依類別" groups={totalsByCategory(occurrences)} />
          <GroupTotalsList title="依付款方式" groups={totalsByPaymentMethod(occurrences)} />
        </>
      )}

      <div className="flex items-start justify-between gap-3 border-t border-leaf-500/15 pt-4">
        <span className="text-sm text-ink-soft">{year} 年度總計</span>
        <CurrencyAmounts totals={yearTotal} className="items-end font-semibold" />
      </div>
    </section>
  );
}
