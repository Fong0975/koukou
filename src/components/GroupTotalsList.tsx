import type { GroupTotal } from "@/lib/billingSummary";
import type { ExchangeRateDto } from "@/types/dto";
import { GroupTotalItems } from "./GroupTotalItems";

interface GroupTotalsListProps {
  title: string;
  groups: GroupTotal[];
  /** USD→TWD rates for converting the subtotals, or null to show them per currency. */
  rates: ExchangeRateDto[] | null;
}

/**
 * Titled list of subtotals, such as per category.
 *
 * @param props.title - Heading, also used as the list's accessible name.
 * @param props.groups - The subtotals, already in display order.
 * @param props.rates - Rates for converting the subtotals to TWD.
 */
export function GroupTotalsList({ title, groups, rates }: GroupTotalsListProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm text-ink-soft">{title}</h3>
      <GroupTotalItems label={title} groups={groups} rates={rates} />
    </div>
  );
}
