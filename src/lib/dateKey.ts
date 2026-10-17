import { toCalendarDate, type CalendarDate } from "./calendarMonth";

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (value: number) => String(value).padStart(2, "0");

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

/** Today's date key in the local time zone. */
export function todayKey(): string {
  return toDateKey(toCalendarDate(new Date()));
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
