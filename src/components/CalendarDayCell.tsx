import type { Occurrence } from "@/lib/billingOccurrences";
import type { ContractExpiry } from "@/lib/contractExpiries";
import { DayChargeCount } from "./DayChargeCount";
import type { PopupAlign } from "./HoverTapPopup";
import { IconLabel } from "./IconLabel";

interface CalendarDayCellProps {
  day: number;
  isToday: boolean;
  occurrences: Occurrence[];
  /** Contracts ending on this day. */
  expiries: ContractExpiry[];
  /** Edge the narrow-screen popup lines up with. */
  popupAlign: PopupAlign;
}

/** Chips listed by name before the rest collapse into "+N". */
const MAX_CHIPS = 3;

/** One wide-screen chip: a contract expiry or a charge. */
interface Chip {
  key: string;
  variant: "expiry" | "charge";
  icon: string | null;
  label: string;
  title: string;
}

/**
 * Lists the day's chips, contract expiries first so they are not the ones collapsed into "+N".
 */
function dayChips(occurrences: Occurrence[], expiries: ContractExpiry[]): Chip[] {
  return [
    ...expiries.map(({ subscription }): Chip => ({
      key: `expiry-${subscription.id}`,
      variant: "expiry",
      icon: subscription.category.icon,
      label: `${subscription.name} 到期`,
      title: `${subscription.name} 合約到期`,
    })),
    ...occurrences.map(({ subscription, scheduleId }): Chip => ({
      key: `${subscription.id}-${scheduleId}`,
      variant: "charge",
      icon: subscription.category.icon,
      label: subscription.name,
      title: subscription.name,
    })),
  ];
}

/**
 * Builds the cell's accessible name, e.g. "15 日（今天）：Netflix、Spotify；合約到期：中華電信".
 */
function cellLabel(day: number, isToday: boolean, occurrences: Occurrence[], expiries: ContractExpiry[]): string {
  const date = `${day} 日${isToday ? "（今天）" : ""}`;
  const names = (items: { subscription: { name: string } }[]) => items.map((o) => o.subscription.name).join("、");
  const parts = [
    ...(occurrences.length > 0 ? [names(occurrences)] : []),
    ...(expiries.length > 0 ? [`合約到期：${names(expiries)}`] : []),
  ];
  return parts.length === 0 ? date : `${date}：${parts.join("；")}`;
}

/**
 * One day of the billing calendar. Wide screens list the contract expiries and charges as chips; narrow
 * screens show dots with their counts instead, which pop up the names on hover or tap.
 *
 * @param props.day - Day of the month.
 * @param props.isToday - Highlights the date number.
 * @param props.occurrences - Charges falling on this day.
 * @param props.expiries - Contracts ending on this day.
 * @param props.popupAlign - Edge the narrow-screen popup lines up with.
 */
export function CalendarDayCell({ day, isToday, occurrences, expiries, popupAlign }: CalendarDayCellProps) {
  const chips = dayChips(occurrences, expiries);
  const hidden = chips.length - MAX_CHIPS;

  return (
    <td
      aria-label={cellLabel(day, isToday, occurrences, expiries)}
      className="h-16 rounded-xl bg-white/45 p-1 align-top sm:h-28 sm:p-1.5"
    >
      <span
        className={`inline-grid size-6 place-items-center rounded-full font-num text-sm ${
          isToday ? "bg-leaf-600 font-semibold text-white" : "text-ink-soft"
        }`}
      >
        {day}
      </span>
      {chips.length > 0 && (
        <>
          <ul className="mt-1 hidden flex-col gap-0.5 sm:flex">
            {chips.slice(0, MAX_CHIPS).map((chip) => (
              <li key={chip.key} title={chip.title} className={`cal-chip cal-chip-${chip.variant}`}>
                <IconLabel icon={chip.icon} label={chip.label} />
              </li>
            ))}
            {hidden > 0 && <li className="px-1.5 text-xs text-ink-soft">+{hidden}</li>}
          </ul>
          <DayChargeCount day={day} occurrences={occurrences} expiries={expiries} align={popupAlign} />
        </>
      )}
    </td>
  );
}
