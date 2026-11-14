import type { PaymentTypeTotals } from "@/lib/billingSummary";
import type { ExchangeRateDto } from "@/types/dto";
import { GroupTotalItems } from "./GroupTotalItems";
import { TotalsSection } from "./TotalsSection";

interface PaymentTypeTotalsListProps {
  title: string;
  sections: PaymentTypeTotals[];
  /** USD→TWD rates for converting the subtotals, or null to show them per currency. */
  rates: ExchangeRateDto[] | null;
}

/**
 * Titled subtotals per payment method, sectioned under a heading per payment type (credit card, other, …).
 *
 * @param props.title - Heading of the whole list.
 * @param props.sections - The payment types with their methods' subtotals, already in display order.
 * @param props.rates - Rates for converting the subtotals to TWD.
 */
export function PaymentTypeTotalsList({ title, sections, rates }: PaymentTypeTotalsListProps) {
  return (
    <TotalsSection title={title}>
      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <div key={section.type}>
            <h4 className="mb-1 text-sm font-semibold text-leaf-800">{section.label}</h4>
            <GroupTotalItems label={section.label} groups={section.groups} rates={rates} />
          </div>
        ))}
      </div>
    </TotalsSection>
  );
}
