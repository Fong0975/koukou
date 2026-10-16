import { shiftMonth, type YearMonth } from "@/lib/calendarMonth";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

interface MonthPickerProps {
  value: YearMonth;
  /** The current month; anchors the year range and the "this month" shortcut. */
  current: YearMonth;
  onChange: (value: YearMonth) => void;
}

/** Years offered on each side of the current year. */
const YEAR_SPAN = 5;

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

/**
 * Lists the selectable years: the current year ± YEAR_SPAN, plus the shown year if it lies outside
 * (reachable by stepping months past the range).
 */
function yearOptions(currentYear: number, shownYear: number): number[] {
  const years = Array.from({ length: YEAR_SPAN * 2 + 1 }, (_, index) => currentYear - YEAR_SPAN + index);
  return years.includes(shownYear) ? years : [...years, shownYear].sort((a, b) => a - b);
}

/**
 * Month navigation for the calendar: previous/next buttons, year and month selects, and a jump back to this month.
 *
 * @param props.value - The month being shown.
 * @param props.current - The current month in local time.
 * @param props.onChange - Receives the newly chosen month.
 */
export function MonthPicker({ value, current, onChange }: MonthPickerProps) {
  const isCurrent = value.year === current.year && value.month === current.month;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" className="icon-btn" onClick={() => onChange(shiftMonth(value, -1))} aria-label="上個月">
        <ChevronLeftIcon />
      </button>
      <select
        className="field w-auto"
        aria-label="年份"
        value={value.year}
        onChange={(event) => onChange({ ...value, year: Number(event.target.value) })}
      >
        {yearOptions(current.year, value.year).map((year) => (
          <option key={year} value={year}>
            {year} 年
          </option>
        ))}
      </select>
      <select
        className="field w-auto"
        aria-label="月份"
        value={value.month}
        onChange={(event) => onChange({ ...value, month: Number(event.target.value) })}
      >
        {MONTHS.map((month) => (
          <option key={month} value={month}>
            {month} 月
          </option>
        ))}
      </select>
      <button type="button" className="icon-btn" onClick={() => onChange(shiftMonth(value, 1))} aria-label="下個月">
        <ChevronRightIcon />
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => onChange(current)} disabled={isCurrent}>
        回到本月
      </button>
    </div>
  );
}
