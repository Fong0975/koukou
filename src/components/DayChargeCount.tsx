import type { Occurrence } from "@/lib/billingOccurrences";
import { HoverTapPopup, type PopupAlign } from "./HoverTapPopup";
import { IconLabel } from "./IconLabel";

interface DayChargeCountProps {
  day: number;
  occurrences: Occurrence[];
  align: PopupAlign;
}

/**
 * Narrow-screen marker of a day's charges: a dot with the charge count that, on mouse hover or a tap,
 * pops up the names of the charges.
 *
 * @param props.day - Day of the month, used in the accessible names.
 * @param props.occurrences - Charges falling on this day; must not be empty.
 * @param props.align - Edge the popup lines up with.
 */
export function DayChargeCount({ day, occurrences, align }: DayChargeCountProps) {
  const label = `${day} 日扣款項目`;

  return (
    <HoverTapPopup
      label={`${label}（${occurrences.length} 筆）`}
      align={align}
      className="mt-1 sm:hidden"
      triggerClassName="flex w-full items-center justify-center gap-1 rounded-md px-1 py-0.5 font-num text-xs text-coin-600"
      trigger={
        <>
          <span className="size-1.5 rounded-full bg-coin-400" />
          {occurrences.length}
        </>
      }
    >
      <ul aria-label={label} className="flex flex-col gap-1">
        {occurrences.map(({ subscription, scheduleId }) => (
          <li key={`${subscription.id}-${scheduleId}`} className="break-words">
            <IconLabel icon={subscription.category.icon} label={subscription.name} />
          </li>
        ))}
      </ul>
    </HoverTapPopup>
  );
}
