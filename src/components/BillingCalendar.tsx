import { occurrencesByDay, type Occurrence } from "@/lib/billingOccurrences";
import { buildMonthGrid, type CalendarDate, type YearMonth } from "@/lib/calendarMonth";
import { WEEKDAY_LABELS } from "@/lib/labels";
import { CalendarDayCell } from "./CalendarDayCell";
import type { PopupAlign } from "./HoverTapPopup";

interface BillingCalendarProps {
  month: YearMonth;
  today: CalendarDate;
  occurrences: Occurrence[];
}

/**
 * Lines a day's popup up with the cell edge nearest the calendar's side, so it does not run off screen.
 *
 * @param column - Weekday column, 0 (Sunday) to 6 (Saturday).
 */
function popupAlign(column: number): PopupAlign {
  if (column < 2) return "start";
  return column > 4 ? "end" : "center";
}

/**
 * Sunday-first month table marking each day's charges, like a wall calendar.
 *
 * @param props.month - The month to show.
 * @param props.today - Today's date, highlighted when it falls in this month.
 * @param props.occurrences - The month's charges.
 */
export function BillingCalendar({ month, today, occurrences }: BillingCalendarProps) {
  const byDay = occurrencesByDay(occurrences);
  const todayDay = today.year === month.year && today.month === month.month ? today.day : null;

  return (
    <table className="w-full table-fixed border-separate border-spacing-1">
      <caption className="sr-only">
        {month.year} 年 {month.month} 月扣款行事曆
      </caption>
      <thead>
        <tr>
          {WEEKDAY_LABELS.map((label) => (
            <th key={label} scope="col" className="py-1.5 text-sm font-normal text-ink-soft">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {buildMonthGrid(month).map((week, row) => (
          <tr key={row}>
            {week.map((day, column) =>
              day === null ? (
                <td key={column} />
              ) : (
                <CalendarDayCell
                  key={column}
                  day={day}
                  isToday={day === todayDay}
                  occurrences={byDay.get(day) ?? []}
                  popupAlign={popupAlign(column)}
                />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
