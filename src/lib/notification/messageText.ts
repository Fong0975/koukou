import { currencyEntries, type CurrencyTotals } from "../billingSummary";
import { formatAmountText, formatCents, formatChargeDate, formatFullDate } from "../format";
import { PAYMENT_TYPE_LABELS } from "../labels";
import {
  hasNoReminders,
  type ChargeReminder,
  type DailyReminders,
  type ExpiryReminder,
  type MonthlySummary,
  type NamedTotal,
} from "./dueReminders";

/** Most characters LINE shows in one text message. */
export const MAX_MESSAGE_LENGTH = 5000;

/**
 * Keeps the first `cap` items of a list.
 *
 * @param items - The full list.
 * @param cap - Most items to keep.
 * @returns The kept items, and how many were dropped.
 */
function capList<T>(items: readonly T[], cap: number): { shown: T[]; hidden: number } {
  const shown = items.slice(0, cap);
  return { shown, hidden: items.length - shown.length };
}

const moreText = (hidden: number) => `…另 ${hidden} 項`;

/** Says when an event is, relative to today, e.g. "今天", "明天" or "3 天後". */
function whenText(daysBefore: number): string {
  if (daysBefore === 0) return "今天";
  return daysBefore === 1 ? "明天" : `${daysBefore} 天後`;
}

/** Formats totals per currency, e.g. "NT$ 1,290 / US$ 20.00". */
function totalsText(totals: CurrencyTotals): string {
  return currencyEntries(totals)
    .map(([currency, cents]) => formatCents(currency, cents))
    .join(" / ");
}

/**
 * Lines of a summary total: its amounts, then the names it is made of.
 *
 * @param label - What the total is, e.g. "本月扣款".
 * @param total - The total and its subscription names.
 * @param cap - Most names to show.
 */
function namedTotalLines(label: string, { totals, names }: NamedTotal, cap: number): string[] {
  if (names.length === 0) return [`・${label}：無`];
  const { shown, hidden } = capList(names, cap);
  const nameText = [...shown, ...(hidden ? [moreText(hidden)] : [])].join("、");
  return [`・${label}：${totalsText(totals)}`, `  ${nameText}`];
}

/**
 * Lines of the monthly summary section.
 *
 * @param summary - The month's summary.
 * @param cap - Most items any of its lists shows.
 */
function summaryLines(summary: MonthlySummary, cap: number): string[] {
  const { shown, hidden } = capList(summary.expiries, cap);
  const expiryLines =
    summary.expiries.length === 0
      ? ["・本月到期：無"]
      : [
          `・本月到期（${summary.expiries.length} 項）`,
          ...shown.map(({ date, subscription }) => `  ${formatChargeDate(date)} ${subscription.name}`),
          ...(hidden ? [`  ${moreText(hidden)}`] : []),
        ];
  return [
    `📅 ${summary.month.month} 月摘要`,
    ...expiryLines,
    ...namedTotalLines("本月預扣", summary.reserve, cap),
    ...namedTotalLines("本月扣款", summary.charge, cap),
  ];
}

/**
 * Lines of the charge reminder section: each charge with its amount, then its payment method.
 *
 * @param charges - The charges to remind of.
 * @param cap - Most charges to show.
 */
function chargeLines(charges: ChargeReminder[], cap: number): string[] {
  const { shown, hidden } = capList(charges, cap);
  return [
    "💳 扣款提醒",
    ...shown.flatMap(({ date, daysBefore, subscription, amount }) => [
      `・${whenText(daysBefore)} ${formatChargeDate(date)} ${subscription.name} ${formatAmountText(subscription.currency, amount)}`,
      `  ${subscription.paymentMethod.name}（${PAYMENT_TYPE_LABELS[subscription.paymentMethod.type]}）`,
    ]),
    ...(hidden ? [moreText(hidden)] : []),
  ];
}

/**
 * Lines of the contract expiry section.
 *
 * @param expiries - The contract ends to remind of.
 * @param cap - Most contract ends to show.
 */
function expiryLines(expiries: ExpiryReminder[], cap: number): string[] {
  const { shown, hidden } = capList(expiries, cap);
  return [
    "⏰ 合約到期",
    ...shown.map(
      ({ date, daysBefore, subscription }) =>
        `・${whenText(daysBefore)} ${formatChargeDate(date)} ${subscription.name}${daysBefore === 0 ? "（今天是最後一天）" : ""}`,
    ),
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
    reminders.monthlySummary && summaryLines(reminders.monthlySummary, cap),
    reminders.charges.length > 0 && chargeLines(reminders.charges, cap),
    reminders.expiries.length > 0 && expiryLines(reminders.expiries, cap),
  ].filter((section): section is string[] => Array.isArray(section));
  const header = `🔔 KouKou 提醒｜${formatFullDate(reminders.today)}`;
  return [header, ...sections.map((lines) => lines.join("\n"))].join("\n\n");
}

/** The longest list in the reminders, which bounds the cap worth trying. */
function longestList({ monthlySummary, charges, expiries }: DailyReminders): number {
  const summaryLists = monthlySummary
    ? [monthlySummary.expiries.length, monthlySummary.reserve.names.length, monthlySummary.charge.names.length]
    : [];
  return Math.max(charges.length, expiries.length, ...summaryLists);
}

/**
 * Builds the day's single LINE text message, combining the monthly summary, charge reminders and
 * expiry reminders. When it would exceed {@link MAX_MESSAGE_LENGTH} characters, every list is cut
 * to the most items that still fit and ends with "…另 N 項", so the message always shows in full.
 *
 * @param reminders - The day's reminders.
 * @returns The message, or null when there is nothing to send.
 */
export function buildReminderMessage(reminders: DailyReminders): string | null {
  if (hasNoReminders(reminders)) return null;

  let low = 0;
  let high = longestList(reminders);
  const full = renderMessage(reminders, high);
  if (full.length <= MAX_MESSAGE_LENGTH) return full;

  // Binary search for the largest cap that fits; the length grows with the cap.
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (renderMessage(reminders, mid).length <= MAX_MESSAGE_LENGTH) low = mid;
    else high = mid - 1;
  }
  const message = renderMessage(reminders, low);
  // Only headers and fixed lines remain at this point; cutting them is a last resort that keeps the send from failing.
  return message.length <= MAX_MESSAGE_LENGTH ? message : `${message.slice(0, MAX_MESSAGE_LENGTH - 1)}…`;
}

/**
 * Builds the message sent from the settings page to check that LINE is set up.
 *
 * @param sentAt - When the test is sent, shown in the server's local time.
 */
export function buildTestMessage(sentAt: string): string {
  return `✅ KouKou 測試訊息\nLINE 通知設定成功，提醒會傳送到這裡。\n傳送時間：${sentAt}`;
}
