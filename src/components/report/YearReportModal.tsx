"use client";

import { useState } from "react";
import { useYearReport } from "@/hooks/useYearReport";
import type { SubscriptionDto } from "@/types/dto";
import { Modal } from "../Modal";
import { DistributionChart } from "./DistributionChart";
import { MonthlyBarChart } from "./MonthlyBarChart";
import { ReportHighlights } from "./ReportHighlights";
import { ReportSection } from "./ReportSection";
import { SubscriptionRanking } from "./SubscriptionRanking";
import { YearStepper } from "./YearStepper";

interface YearReportModalProps {
  items: SubscriptionDto[];
  /** The year shown first. */
  initialYear: number;
  onClose: () => void;
}

/**
 * Dialog of one year's spending: headline figures, monthly totals, distributions per category and payment
 * method, and the subscriptions ranked by cost. The year can be stepped back and forth inside it.
 *
 * @param props.items - All subscriptions.
 * @param props.initialYear - The year shown first.
 * @param props.onClose - Closes the dialog.
 */
export function YearReportModal({ items, initialYear, onClose }: YearReportModalProps) {
  const [year, setYear] = useState(initialYear);
  const { highlights, months, byCategory, byPaymentMethod, ranking } = useYearReport(items, year);

  return (
    <Modal
      title="年度報表"
      onClose={onClose}
      widthClass="max-w-4xl"
      actions={<YearStepper year={year} onChange={setYear} />}
    >
      {highlights.chargeCount === 0 ? (
        <p className="py-12 text-center text-ink-soft">{year} 年沒有任何扣款</p>
      ) : (
        <div className="flex flex-col gap-4">
          <ReportHighlights highlights={highlights} />
          <ReportSection title="每月扣款">
            <MonthlyBarChart months={months} averageTwdCents={highlights.monthlyAverageTwdCents} />
          </ReportSection>
          <div className="grid gap-4 md:grid-cols-2">
            <DistributionChart title="依類別" groups={byCategory} />
            <DistributionChart title="依付款方式" groups={byPaymentMethod} />
          </div>
          <ReportSection title="項目排行">
            <SubscriptionRanking ranking={ranking} />
          </ReportSection>
        </div>
      )}
    </Modal>
  );
}
