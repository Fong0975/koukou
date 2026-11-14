import { z } from "zod";
import {
  EXPIRY_REMINDER_DAYS,
  MAX_CHARGE_REMINDER_DAYS_BEFORE,
  MAX_CUSTOM_CHARGE_REMINDERS,
} from "@/lib/constants/reminders";
import { countDaysAhead } from "@/lib/form/reminderDays";
import { isUniqueBy, type IssueSink } from "./common";

const ascending = <T extends number>(days: T[]) => [...days].sort((a, b) => a - b);

const chargeDayMessage = `扣款提醒需介於 0–${MAX_CHARGE_REMINDER_DAYS_BEFORE} 天前`;

/**
 * Days ahead of each charge to send a reminder (0 = on the charge day). Besides the charge day
 * itself, at most {@link MAX_CUSTOM_CHARGE_REMINDERS} days may be chosen. Sorted ascending.
 */
const chargeReminderDaysSchema = z
  .array(
    z
      .number({ error: "扣款提醒天數格式錯誤" })
      .int("扣款提醒天數必須為整數")
      .min(0, chargeDayMessage)
      .max(MAX_CHARGE_REMINDER_DAYS_BEFORE, chargeDayMessage),
    { error: "扣款提醒格式錯誤" },
  )
  .refine((days) => isUniqueBy(days), "扣款提醒天數不可重複")
  .refine(
    (days) => countDaysAhead(days) <= MAX_CUSTOM_CHARGE_REMINDERS,
    `自訂提醒天數最多 ${MAX_CUSTOM_CHARGE_REMINDERS} 個`,
  )
  .transform(ascending);

/** Days ahead of the contract end date to send a reminder, out of {@link EXPIRY_REMINDER_DAYS}. Sorted ascending. */
const expiryReminderDaysSchema = z
  .array(z.literal(EXPIRY_REMINDER_DAYS, { error: `到期提醒只能選 ${EXPIRY_REMINDER_DAYS.join("、")} 天前` }), {
    error: "到期提醒格式錯誤",
  })
  .refine((days) => isUniqueBy(days), "到期提醒天數不可重複")
  .transform(ascending);

/** A subscription's LINE reminders; none when omitted. */
export const remindersSchema = z
  .object(
    {
      chargeDaysBefore: chargeReminderDaysSchema.default([]),
      expiryDaysBefore: expiryReminderDaysSchema.default([]),
    },
    { error: "提醒設定格式錯誤" },
  )
  .default({ chargeDaysBefore: [], expiryDaysBefore: [] });

/** The parts of a subscription that expiry reminders depend on. */
interface ExpiryReminderFields {
  contractEndDate: string | null;
  reminders: { expiryDaysBefore: readonly number[] };
}

/**
 * Reports expiry reminders on a subscription without a contract end date, since there is
 * nothing for them to fire before.
 *
 * @param data - The parsed subscription.
 * @param ctx - Where the issues are reported.
 */
export function checkExpiryReminders(data: ExpiryReminderFields, ctx: IssueSink): void {
  if (data.contractEndDate === null && data.reminders.expiryDaysBefore.length > 0) {
    ctx.addIssue({
      code: "custom",
      path: ["reminders", "expiryDaysBefore"],
      message: "未設定到期日，無法設定到期提醒",
    });
  }
}
