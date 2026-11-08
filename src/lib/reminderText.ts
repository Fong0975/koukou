import type { RemindersDto } from "@/types/dto";

/**
 * Names a charge reminder day, e.g. "扣款當日" or "扣款前 3 天".
 *
 * @param day - Days ahead of the charge.
 */
export function formatChargeReminderDay(day: number): string {
  return day === 0 ? "扣款當日" : `扣款前 ${day} 天`;
}

/**
 * Names a chosen charge reminder day on its chip, e.g. "當天" or "3 天前".
 *
 * @param day - Days ahead of the charge.
 */
export function formatReminderChip(day: number): string {
  return day === 0 ? "當天" : `${day} 天前`;
}

/**
 * Names an expiry reminder day, e.g. "到期當日" or "到期前 7 天".
 *
 * @param day - Days ahead of the contract end date.
 */
export function formatExpiryReminderDay(day: number): string {
  return day === 0 ? "到期當日" : `到期前 ${day} 天`;
}

/**
 * Summarizes a subscription's LINE reminders, e.g. "LINE 提醒：扣款當日、扣款前 3 天、到期前 7 天".
 *
 * @param reminders - The reminder days.
 * @returns The summary, or null without any reminder.
 */
export function formatReminders(reminders: RemindersDto): string | null {
  const parts = [
    ...reminders.chargeDaysBefore.map(formatChargeReminderDay),
    ...reminders.expiryDaysBefore.map(formatExpiryReminderDay),
  ];
  return parts.length > 0 ? `LINE 提醒：${parts.join("、")}` : null;
}
