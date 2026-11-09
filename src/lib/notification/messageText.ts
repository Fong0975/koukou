import { formatAmountText } from "../format";
import { hasNoReminders, type ChargeReminder, type DailyReminders, type ExpiryReminder } from "./dueReminders";
import { formatMessageDate, formatMonthDay } from "./messageDate";
import { capList, fitToLimit, joinBlocks, moreText } from "./messageLayout";

/** Indent of the lines under the charge section title. */
const CHARGE_INDENT = "  ";

/** Says when an event is, relative to today, e.g. "今天", "明天" or "3 天後". */
function whenText(daysBefore: number): string {
  if (daysBefore === 0) return "今天";
  return daysBefore === 1 ? "明天" : `${daysBefore} 天後`;
}

/**
 * The first line of the message, which LINE also shows in the notification and chat list: what the
 * message holds, then today's date, e.g. "🔔 扣款 2 筆・到期 1 項｜12/1 (二)".
 *
 * @param reminders - The day's reminders, counted in full even when lists are cut.
 */
function headerLine({ today, charges, expiries }: DailyReminders): string {
  const parts = [
    charges.length > 0 && `扣款 ${charges.length} 筆`,
    expiries.length > 0 && `到期 ${expiries.length} 項`,
  ].filter((part): part is string => typeof part === "string");
  return `🔔 ${parts.join("・")}｜${formatMessageDate(today)}`;
}

/**
 * Splits charges into runs that fall on the same date, keeping their order.
 *
 * @param charges - Charges sorted by date.
 */
function groupByDate(charges: ChargeReminder[]): ChargeReminder[][] {
  const groups: ChargeReminder[][] = [];
  for (const charge of charges) {
    const last = groups.at(-1);
    if (last && last[0].date === charge.date) last.push(charge);
    else groups.push([charge]);
  }
  return groups;
}

/**
 * Lines of one date's charges: the date once, then each charge with its amount and payment method.
 *
 * @param group - Charges on the same date.
 */
function chargeGroupLines(group: ChargeReminder[]): string[] {
  const { date, daysBefore } = group[0];
  return [
    `▸ ${whenText(daysBefore)} ${formatMessageDate(date)}`,
    ...group.flatMap(({ subscription, amount }) => [
      `・${subscription.name} ${formatAmountText(subscription.currency, amount)}`,
      `  ${subscription.paymentMethod.name}`,
    ]),
  ];
}

/**
 * Lines of the charge reminder section, grouped by date with a blank line between dates.
 *
 * @param charges - The charges to remind of, sorted by date.
 * @param cap - Most charges to show.
 */
function chargeLines(charges: ChargeReminder[], cap: number): string[] {
  const { shown, hidden } = capList(charges, cap);
  const body = joinBlocks(groupByDate(shown).map(chargeGroupLines));
  return [
    "💳 扣款提醒",
    ...[...body, ...(hidden ? [moreText(hidden)] : [])].map((line) => (line ? `${CHARGE_INDENT}${line}` : line)),
  ];
}

/** Says when a contract ends, e.g. "今天到期" or "7 天後 (11/15) 到期". */
function expiryText({ date, daysBefore }: ExpiryReminder): string {
  return daysBefore === 0 ? "今天到期" : `${whenText(daysBefore)} (${formatMonthDay(date)}) 到期`;
}

/**
 * Lines of the contract expiry section, each led by the subscription's name.
 *
 * @param expiries - The contract ends to remind of.
 * @param cap - Most contract ends to show.
 */
function expiryLines(expiries: ExpiryReminder[], cap: number): string[] {
  const { shown, hidden } = capList(expiries, cap);
  return [
    "⏰ 合約到期",
    ...shown.map((expiry) => `・${expiry.subscription.name}：${expiryText(expiry)}`),
    ...(hidden ? [moreText(hidden)] : []),
  ];
}

/**
 * Renders the message with every list cut to at most `cap` items.
 *
 * @param reminders - The day's reminders.
 * @param cap - Most items any single list shows.
 */
function renderMessage(reminders: DailyReminders, cap: number): string {
  const sections = [
    reminders.charges.length > 0 && chargeLines(reminders.charges, cap),
    reminders.expiries.length > 0 && expiryLines(reminders.expiries, cap),
  ].filter((section): section is string[] => Array.isArray(section));
  return [headerLine(reminders), ...sections.map((lines) => lines.join("\n"))].join("\n\n");
}

/**
 * Builds the day's LINE reminder message, combining charge reminders and expiry reminders. The
 * monthly summary is a message of its own. When it would exceed the length LINE allows, every list is
 * cut to the most items that still fit and ends with "…另 N 項".
 *
 * @param reminders - The day's reminders.
 * @returns The message, or null when there is nothing to send.
 */
export function buildReminderMessage(reminders: DailyReminders): string | null {
  if (hasNoReminders(reminders)) return null;
  const longestList = Math.max(reminders.charges.length, reminders.expiries.length);
  return fitToLimit((cap) => renderMessage(reminders, cap), longestList);
}

/**
 * Builds the message sent from the settings page to check that LINE is set up.
 *
 * @param sentAt - When the test is sent, shown in the server's local time.
 */
export function buildTestMessage(sentAt: string): string {
  return `✅ KouKou 測試訊息\nLINE 通知設定成功，提醒會傳送到這裡。\n傳送時間：${sentAt}`;
}
