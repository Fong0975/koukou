import type { GroupTotal } from "@/lib/billingSummary";
import { convertedTwdCents } from "@/lib/currencyConversion";
import type { ExchangeRateDto } from "@/types/dto";
import { ConvertedAmounts } from "./ConvertedAmounts";

interface GroupTotalsListProps {
  title: string;
  groups: GroupTotal[];
  /** USD→TWD rates for converting the subtotals, or null to show them per currency. */
  rates: ExchangeRateDto[] | null;
}

/**
 * Titled list of subtotals, such as per category or per payment method.
 *
 * @param props.title - Heading, also used as the list's accessible name.
 * @param props.groups - The subtotals, already in display order.
 * @param props.rates - Rates for converting the subtotals to TWD.
 */
export function GroupTotalsList({ title, groups, rates }: GroupTotalsListProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm text-ink-soft">{title}</h3>
      <ul aria-label={title} className="flex flex-col gap-1.5">
        {groups.map((group) => (
          <li key={group.key} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {group.icon && <span aria-hidden="true">{group.icon} </span>}
              {group.label}
            </span>
            <ConvertedAmounts totals={group.totals} twdCents={convertedTwdCents(group.occurrences, rates)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
