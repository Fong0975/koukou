import { dateKeyToUtcDate } from "../dateKey";
import { WEEKDAY_LABELS } from "../labels";

/**
 * Formats a date key as month and day, e.g. "11/15".
 *
 * @param date - A "YYYY-MM-DD" key.
 */
export function formatMonthDay(date: string): string {
  const utc = dateKeyToUtcDate(date);
  return `${utc.getUTCMonth() + 1}/${utc.getUTCDate()}`;
}

/**
 * Formats a date key as month and day with its weekday in half-width parentheses, e.g. "11/15 (日)",
 * which keeps LINE messages narrower than the full-width form used on the web page.
 *
 * @param date - A "YYYY-MM-DD" key.
 */
export function formatMessageDate(date: string): string {
  return `${formatMonthDay(date)} (${WEEKDAY_LABELS[dateKeyToUtcDate(date).getUTCDay()]})`;
}
