import {
  EXPIRY_REMINDER_DAYS,
  MAX_CHARGE_REMINDER_DAYS_BEFORE,
  MAX_CUSTOM_CHARGE_REMINDERS,
} from "../constants/reminders";

/** A day ahead of a contract end date that an expiry reminder can be sent on. */
type ExpiryReminderDay = (typeof EXPIRY_REMINDER_DAYS)[number];

/**
 * Tells whether a day is one an expiry reminder can be sent on.
 *
 * @param day - Days ahead of the contract end date.
 */
export function isExpiryReminderDay(day: number): day is ExpiryReminderDay {
  return (EXPIRY_REMINDER_DAYS as readonly number[]).includes(day);
}

/**
 * Adds or removes one reminder day, keeping the list sorted and free of duplicates.
 *
 * @param days - The chosen days ahead of the event.
 * @param day - The day to add or remove.
 * @param on - True to add it, false to remove it.
 * @returns A new ascending list.
 */
export function toggleDay(days: readonly number[], day: number, on: boolean): number[] {
  const rest = days.filter((existing) => existing !== day);
  return (on ? [...rest, day] : rest).sort((a, b) => a - b);
}

/**
 * Counts the chosen charge reminder days ahead of the charge, which are capped; the charge day itself is not.
 *
 * @param days - The chosen days ahead of the charge.
 */
export function countDaysAhead(days: readonly number[]): number {
  return days.filter((day) => day > 0).length;
}

/**
 * Reads a "days before the charge" value typed by a person; 0 means the charge day.
 *
 * @param text - The typed value.
 * @param days - The charge reminder days already chosen.
 * @returns The day to add, or the reason it cannot be added.
 */
export function parseCustomReminderDay(text: string, days: readonly number[]): { day: number } | { error: string } {
  const trimmed = text.trim();
  if (trimmed === "") return { error: "請輸入天數" };
  const day = Number(trimmed);
  if (!/^\d+$/.test(trimmed) || day > MAX_CHARGE_REMINDER_DAYS_BEFORE) {
    return { error: `天數需為 0–${MAX_CHARGE_REMINDER_DAYS_BEFORE} 的整數` };
  }
  if (days.includes(day)) return { error: day === 0 ? "已經有當天的提醒" : `已經有 ${day} 天前的提醒` };
  if (day > 0 && countDaysAhead(days) >= MAX_CUSTOM_CHARGE_REMINDERS) {
    return { error: `提前提醒最多 ${MAX_CUSTOM_CHARGE_REMINDERS} 個` };
  }
  return { day };
}
