/** A calendar month in local time; `month` is 1–12. */
export interface YearMonth {
  year: number;
  month: number;
}

/** A calendar date in local time; `month` is 1–12. */
export interface CalendarDate extends YearMonth {
  day: number;
}

/**
 * Counts the days of a month, accounting for leap years.
 *
 * @param target - The month.
 * @returns 28–31.
 */
export function daysInMonth({ year, month }: YearMonth): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Moves a month forwards or backwards, rolling over year boundaries.
 *
 * @param target - The starting month.
 * @param delta - Months to move; negative goes back.
 * @returns The resulting month.
 */
export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

/**
 * Reads the local calendar date of a timestamp.
 *
 * @param date - The timestamp.
 * @returns Its year, month (1–12) and day in the local time zone.
 */
export function toCalendarDate(date: Date): CalendarDate {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/**
 * Groups day-of-month entries, such as charges or contract expiries, by the day they fall on.
 *
 * @param entries - The entries.
 * @returns A map from day of month to that day's entries, in input order.
 */
export function groupByDay<T extends { day: number }>(entries: readonly T[]): Map<number, T[]> {
  const byDay = new Map<number, T[]>();
  for (const entry of entries) {
    byDay.set(entry.day, [...(byDay.get(entry.day) ?? []), entry]);
  }
  return byDay;
}

/**
 * Lays a month out as Sunday-first weeks for a calendar table.
 *
 * @param target - The month.
 * @returns Rows of 7 cells; each cell is a day of the month, or null for padding outside it.
 */
export function buildMonthGrid(target: YearMonth): (number | null)[][] {
  const leading = new Date(target.year, target.month - 1, 1).getDay();
  const days = Array.from({ length: daysInMonth(target) }, (_, index) => index + 1);
  const cells: (number | null)[] = [...Array<null>(leading).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let start = 0; start < cells.length; start += 7) weeks.push(cells.slice(start, start + 7));
  return weeks;
}
