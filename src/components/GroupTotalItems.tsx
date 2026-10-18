import type { GroupTotal } from "@/lib/billingSummary";
import { convertedTwdCents } from "@/lib/currencyConversion";
import type { ExchangeRateDto } from "@/types/dto";
import { ConvertedAmounts } from "./ConvertedAmounts";
import { IconLabel } from "./IconLabel";

interface GroupTotalItemsProps {
  /** Accessible name of the list. */
  label: string;
  groups: GroupTotal[];
  /** USD→TWD rates for converting the subtotals, or null to show them per currency. */
  rates: ExchangeRateDto[] | null;
}

/**
 * List of subtotals, one row per group with its label on the left and its amount on the right.
 *
 * @param props.label - The list's accessible name.
 * @param props.groups - The subtotals, already in display order.
 * @param props.rates - Rates for converting the subtotals to TWD.
 */
export function GroupTotalItems({ label, groups, rates }: GroupTotalItemsProps) {
  return (
    <ul aria-label={label} className="flex flex-col gap-1.5">
      {groups.map((group) => (
        <li key={group.key} className="flex items-start justify-between gap-3 text-sm">
          <span className="min-w-0 break-words">
            <IconLabel icon={group.icon} label={group.label} />
          </span>
          <ConvertedAmounts totals={group.totals} twdCents={convertedTwdCents(group.occurrences, rates)} />
        </li>
      ))}
    </ul>
  );
}
