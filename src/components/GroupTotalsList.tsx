import type { GroupTotal } from "@/lib/billingSummary";
import { CurrencyAmounts } from "./CurrencyAmounts";

interface GroupTotalsListProps {
  title: string;
  groups: GroupTotal[];
}

/**
 * Titled list of subtotals, such as per category or per payment method.
 *
 * @param props.title - Heading, also used as the list's accessible name.
 * @param props.groups - The subtotals, already in display order.
 */
export function GroupTotalsList({ title, groups }: GroupTotalsListProps) {
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
            <CurrencyAmounts totals={group.totals} />
          </li>
        ))}
      </ul>
    </div>
  );
}
