import { toCalendarDate } from "../calendarMonth";
import { dateKeyToUtcDate, toDateKey } from "../dateKey";
import { WEEKDAY_LABELS } from "../labels";

/**
 * Formats a charge date with its weekday, e.g. "10/1（四）".
 *
 * @param date - A "YYYY-MM-DD" key.
 */
export function formatChargeDate(date: string): string {
  const utc = dateKeyToUtcDate(date);
  return `${utc.getUTCMonth() + 1}/${utc.getUTCDate()}（${WEEKDAY_LABELS[utc.getUTCDay()]}）`;
}

/**
 * Describes how far away a contract's end date is, e.g. "剩 12 天", "今天到期" or "已到期 3 天".
 *
 * @param days - Days from today to the end date; negative once it has passed.
 */
export function formatContractRemaining(days: number): string {
  if (days > 0) return `剩 ${days} 天`;
  return days === 0 ? "今天到期" : `已到期 ${-days} 天`;
}

/**
 * Formats a date key with its year, e.g. "2027/03/31".
 *
 * @param date - A "YYYY-MM-DD" key.
 */
export function formatFullDate(date: string): string {
  return date.replaceAll("-", "/");
}

/**
 * Formats an ISO timestamp as a local date and time, e.g. "2026/10/19 16:05".
 *
 * @param timestamp - An ISO timestamp.
 * @returns The formatted time, or the input unchanged when it is not a valid timestamp.
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  const time = [date.getHours(), date.getMinutes()].map((part) => String(part).padStart(2, "0")).join(":");
  return `${formatFullDate(toDateKey(toCalendarDate(date)))} ${time}`;
}
