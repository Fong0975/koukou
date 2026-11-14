import { toCalendarDate, type CalendarDate, type YearMonth } from "./calendarMonth";

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Zero-pads a number to two digits, e.g. 5 → "05".
 *
 * @param value - A non-negative number below 100.
 */
export const pad2 = (value: number): string => String(value).padStart(2, "0");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Checks that a string is a real calendar date written as "YYYY-MM-DD".
 *
 * @param value - The string to check.
 * @returns False for other formats and for impossible dates such as "2026-02-30".
 */
export function isDateKey(value: string): boolean {
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Formats a calendar date as a "YYYY-MM-DD" key. Keys of the same format sort and
 * compare correctly as plain strings, which avoids time-zone shifts of Date objects.
 *
 * @param date - The calendar date.
 */
export function toDateKey({ year, month, day }: CalendarDate): string {
  return `${String(year).padStart(4, "0")}-${pad2(month)}-${pad2(day)}`;
}

/**
 * The date key of a moment in the local time zone.
 *
 * @param date - The moment.
 */
export function localDateKey(date: Date): string {
  return toDateKey(toCalendarDate(date));
}

/**
 * The time of a moment in the local time zone as "HH:mm" on a 24-hour clock.
 *
 * @param date - The moment.
 */
export function localClockTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Today's date key in the local time zone. */
export function todayKey(): string {
  return localDateKey(new Date());
}

/**
 * Reads the month a date key falls in.
 *
 * @param key - A "YYYY-MM-DD" key.
 */
export function dateKeyToYearMonth(key: string): YearMonth {
  return { year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) };
}

/**
 * Moves a date key by whole days, rolling over months and years.
 *
 * @param key - A "YYYY-MM-DD" key.
 * @param days - Days to move; negative goes back.
 */
export function addDays(key: string, days: number): string {
  const date = dateKeyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateToDateKey(date);
}

/**
 * Converts a date key to the UTC-midnight Date that Prisma stores in a DATE column.
 *
 * @param key - A "YYYY-MM-DD" key.
 */
export function dateKeyToUtcDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/**
 * Converts a DATE column value (UTC midnight) back to its date key.
 *
 * @param date - The value read from the database.
 */
export function utcDateToDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Counts the whole days from today to a date. Both are read as UTC midnights, so daylight saving shifts
 * never add or drop a day.
 *
 * @param today - Today's date.
 * @param dateKey - The target day as "YYYY-MM-DD".
 * @returns 0 for today, positive for later days, negative for days already past.
 */
export function daysUntil(today: CalendarDate, dateKey: string): number {
  const diff = dateKeyToUtcDate(dateKey).getTime() - dateKeyToUtcDate(toDateKey(today)).getTime();
  return Math.round(diff / MS_PER_DAY);
}
