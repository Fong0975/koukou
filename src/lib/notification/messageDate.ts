import { dateKeyToUtcDate, pad2 } from "../date/dateKey";
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

/**
 * Formats a date key as zero-padded month and day with its weekday, e.g. "11/05(四)".
 *
 * @param date - A "YYYY-MM-DD" key.
 */
export function formatPaddedDate(date: string): string {
  const utc = dateKeyToUtcDate(date);
  return `${pad2(utc.getUTCMonth() + 1)}/${pad2(utc.getUTCDate())}(${WEEKDAY_LABELS[utc.getUTCDay()]})`;
}

/** Says when an event is, relative to today, e.g. "今天", "明天" or "3 天後". */
export function whenText(daysBefore: number): string {
  if (daysBefore === 0) return "今天";
  return daysBefore === 1 ? "明天" : `${daysBefore} 天後`;
}
