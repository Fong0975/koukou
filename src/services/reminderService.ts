import { toCalendarDate } from "@/lib/calendarMonth";
import { toDateKey } from "@/lib/dateKey";
import { formatTimestamp } from "@/lib/format";
import { createLogger } from "@/lib/logger";
import { collectDailyReminders } from "@/lib/notification/dueReminders";
import { buildReminderMessage, buildTestMessage } from "@/lib/notification/messageText";
import { isSendTimeReached } from "@/lib/notification/sendTime";
import { pushText } from "./lineClient";
import { findDispatch, saveDispatch } from "./notificationDispatchStore";
import { readNotificationSetting } from "./notificationSettingService";
import { listSubscriptions } from "./subscriptionService";

const logger = createLogger("reminderService");

/** Most tries at sending one day's message before giving up on it. */
export const MAX_SEND_ATTEMPTS = 3;

/** What one run of {@link runDailyReminder} did. */
export type ReminderRunResult =
  /** Notifications are switched off. */
  | "disabled"
  /** Today's send time has not come yet. */
  | "not-due"
  /** Today's message was already handled, or failed too often. */
  | "done"
  /** Today has nothing to report, so nothing was sent. */
  | "skipped"
  | "sent"
  /** Sending failed; a later run tries again until {@link MAX_SEND_ATTEMPTS}. */
  | "failed";

/**
 * Sends today's reminder message once its send time has come. Each day is sent at most once; a
 * server that was down at the send time catches up on its first run later that day, and a failed
 * send is retried on later runs up to {@link MAX_SEND_ATTEMPTS} tries. Notifications switched on after
 * the send time start the next day, since saving them marks today as skipped.
 *
 * @param now - The current time; dates and the send time are read in the server's time zone.
 * @returns What the run did.
 */
export async function runDailyReminder(now: Date = new Date()): Promise<ReminderRunResult> {
  const setting = await readNotificationSetting();
  if (!setting.enabled) return "disabled";
  if (!isSendTimeReached(now, setting.sendTime)) return "not-due";

  const today = toDateKey(toCalendarDate(now));
  const previous = await findDispatch(today);
  if (previous && (previous.status !== "FAILED" || previous.attempts >= MAX_SEND_ATTEMPTS)) return "done";
  const attempts = (previous?.attempts ?? 0) + 1;

  const reminders = collectDailyReminders(await listSubscriptions(), today, {
    monthlySummary: setting.monthlySummaryEnabled,
  });
  const message = buildReminderMessage(reminders);
  if (message === null) {
    await saveDispatch(today, { status: "SKIPPED", attempts: previous?.attempts ?? 0 });
    logger.info("No reminders today", { date: today });
    return "skipped";
  }

  try {
    await pushText(message);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await saveDispatch(today, { status: "FAILED", attempts }, reason);
    logger.error("Reminder message failed", { date: today, attempts }, error);
    return "failed";
  }
  await saveDispatch(today, { status: "SENT", attempts });
  logger.info("Reminder message sent", {
    date: today,
    attempts,
    charges: reminders.charges.length,
    expiries: reminders.expiries.length,
    monthlySummary: reminders.monthlySummary !== null,
  });
  return "sent";
}

/**
 * Sends a test message to check the LINE setup, regardless of the notification switches.
 *
 * @param now - The current time, shown in the message.
 * @throws UpstreamError when LINE is not configured or rejects the message.
 */
export async function sendTestMessage(now: Date = new Date()): Promise<void> {
  await pushText(buildTestMessage(formatTimestamp(now.toISOString())));
  logger.info("Test message sent");
}
