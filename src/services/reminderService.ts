import { randomUUID } from "node:crypto";
import { toCalendarDate } from "@/lib/calendarMonth";
import { dateKeyToYearMonth, toDateKey } from "@/lib/dateKey";
import { formatTimestamp } from "@/lib/format/date";
import { createLogger } from "@/lib/logger";
import { buildMonthlySummary, collectDailyReminders, isFirstOfMonth } from "@/lib/notification/dueReminders";
import { buildTestMessage } from "@/lib/notification/messageText";
import { buildReminderCard } from "@/lib/notification/reminderCard";
import { isSendTimeReached } from "@/lib/notification/sendTime";
import { buildSummaryMessage } from "@/lib/notification/summaryMessage";
import { pushMessage } from "./lineClient";
import { findDispatch } from "./notificationDispatchStore";
import { readNotificationSetting } from "./notificationSettingService";
import { deliverMessage, isPending, type DeliveryResult } from "./reminderDelivery";
import { listSubscriptions } from "./subscriptionService";

const logger = createLogger("reminderService");

/** What one run of {@link runDailyReminder} did. */
export type ReminderRunResult =
  /** Notifications are switched off. */
  | "disabled"
  /** Today's send time has not come yet. */
  | "not-due"
  /** Today's messages were already handled, or failed too often. */
  | "done"
  | DeliveryResult;

/**
 * Sums up what each message of a run did: a failure outweighs a send, which outweighs a skip.
 *
 * @param results - What each message did; never empty.
 */
function summarize(results: DeliveryResult[]): DeliveryResult {
  if (results.includes("failed")) return "failed";
  return results.includes("sent") ? "sent" : "skipped";
}

/**
 * Sends today's messages once their send time has come: first the monthly summary (on the 1st, when
 * switched on), then the day's charge and expiry reminders. Each message is sent at most once per day
 * and tracked on its own, so a failed message is retried up to MAX_SEND_ATTEMPTS tries without
 * repeating the other. A server that was down at the send time catches up on its first run later that
 * day. Notifications switched on after the send time start the next day, since saving them marks
 * today as skipped.
 *
 * @param now - The current time; dates and the send time are read in the server's time zone.
 * @returns What the run did.
 */
export async function runDailyReminder(now: Date = new Date()): Promise<ReminderRunResult> {
  const setting = await readNotificationSetting();
  if (!setting.enabled) return "disabled";
  if (!isSendTimeReached(now, setting.sendTime)) return "not-due";

  const today = toDateKey(toCalendarDate(now));
  const summaryDue = setting.monthlySummaryEnabled && isFirstOfMonth(today);
  const [summaryPrevious, dailyPrevious] = await Promise.all([
    summaryDue ? findDispatch(today, "SUMMARY") : null,
    findDispatch(today, "DAILY"),
  ]);
  const summaryPending = summaryDue && isPending(summaryPrevious);
  if (!summaryPending && !isPending(dailyPrevious)) return "done";

  const items = await listSubscriptions();
  const results: DeliveryResult[] = [];
  if (summaryPending) {
    const summary = buildSummaryMessage(buildMonthlySummary(items, dateKeyToYearMonth(today)), randomUUID());
    results.push(await deliverMessage(today, "SUMMARY", summary, summaryPrevious));
  }
  if (isPending(dailyPrevious)) {
    const reminders = buildReminderCard(collectDailyReminders(items, today));
    results.push(await deliverMessage(today, "DAILY", reminders, dailyPrevious));
  }
  return summarize(results);
}

/**
 * Sends a test message to check the LINE setup, regardless of the notification switches.
 *
 * @param now - The current time, shown in the message.
 * @throws UpstreamError when LINE is not configured or rejects the message.
 */
export async function sendTestMessage(now: Date = new Date()): Promise<void> {
  await pushMessage({ type: "text", text: buildTestMessage(formatTimestamp(now.toISOString())) });
  logger.info("Test message sent");
}
