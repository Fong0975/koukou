import type { Occurrence } from "@/lib/billingOccurrences";
import { DayChargeCount } from "./DayChargeCount";
import type { PopupAlign } from "./HoverTapPopup";
import { IconLabel } from "./IconLabel";

interface CalendarDayCellProps {
  day: number;
  isToday: boolean;
  occurrences: Occurrence[];
  /** Edge the narrow-screen charge popup lines up with. */
  popupAlign: PopupAlign;
}

/** Charges listed by name before the rest collapse into "+N". */
const MAX_CHIPS = 3;

/**
 * Builds the cell's accessible name, e.g. "15 日（今天）：Netflix、Spotify".
 */
function cellLabel(day: number, isToday: boolean, occurrences: Occurrence[]): string {
  const date = `${day} 日${isToday ? "（今天）" : ""}`;
  return occurrences.length === 0 ? date : `${date}：${occurrences.map((o) => o.subscription.name).join("、")}`;
}

/**
 * One day of the billing calendar. Wide screens list the charges as chips; narrow screens show a dot with
 * the charge count instead, which pops up the charges' names on hover or tap.
 *
 * @param props.day - Day of the month.
 * @param props.isToday - Highlights the date number.
 * @param props.occurrences - Charges falling on this day.
 * @param props.popupAlign - Edge the narrow-screen popup lines up with.
 */
export function CalendarDayCell({ day, isToday, occurrences, popupAlign }: CalendarDayCellProps) {
  const hidden = occurrences.length - MAX_CHIPS;

  return (
    <td
      aria-label={cellLabel(day, isToday, occurrences)}
      className="h-16 rounded-xl bg-white/45 p-1 align-top sm:h-28 sm:p-1.5"
    >
      <span
        className={`inline-grid size-6 place-items-center rounded-full font-num text-sm ${
          isToday ? "bg-leaf-600 font-semibold text-white" : "text-ink-soft"
        }`}
      >
        {day}
      </span>
      {occurrences.length > 0 && (
        <>
          <ul className="mt-1 hidden flex-col gap-0.5 sm:flex">
            {occurrences.slice(0, MAX_CHIPS).map(({ subscription, scheduleId }) => (
              <li
                key={`${subscription.id}-${scheduleId}`}
                title={subscription.name}
                className="truncate rounded-md bg-coin-100/90 px-1.5 py-0.5 text-xs text-coin-600"
              >
                <IconLabel icon={subscription.category.icon} label={subscription.name} />
              </li>
            ))}
            {hidden > 0 && <li className="px-1.5 text-xs text-ink-soft">+{hidden}</li>}
          </ul>
          <DayChargeCount day={day} occurrences={occurrences} align={popupAlign} />
        </>
      )}
    </td>
  );
}
