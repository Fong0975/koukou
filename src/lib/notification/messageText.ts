import { currencyEntries, type CurrencyTotals } from "../billingSummary";
import { formatAmountText, formatCents } from "../format";
import {
  hasNoReminders,
  type ChargeReminder,
  type DailyReminders,
  type ExpiryReminder,
  type MonthlySummary,
  type NamedTotal,
} from "./dueReminders";
import { formatMessageDate, formatMonthDay } from "./messageDate";

/** Most characters LINE shows in one text message. */
export const MAX_MESSAGE_LENGTH = 5000;

/** Indent of the lines under the charge section title. */
const CHARGE_INDENT = "  ";

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

/** Formats totals per currency, e.g. "NT$ 1,290 + US$ 20.00"; the currencies are never converted into one. */
function totalsText(totals: CurrencyTotals): string {
  return currencyEntries(totals)
    .map(([currency, cents]) => formatCents(currency, cents))
    .join(" + ");
}

/**
 * The first line of the message, which LINE also shows in the notification and chat list: what the
 * message holds, then today's date, e.g. "🔔 12 月摘要・扣款 2 筆・到期 1 項｜12/1 (二)".
 *
 * @param reminders - The day's reminders, counted in full even when lists are cut.
 */
function headerLine({ today, monthlySummary, charges, expiries }: DailyReminders): string {
  const parts = [
    monthlySummary && `${monthlySummary.month.month} 月摘要`,
    charges.length > 0 && `扣款 ${charges.length} 筆`,
    expiries.length > 0 && `到期 ${expiries.length} 項`,
  ].filter((part): part is string => typeof part === "string");
  return `🔔 ${parts.join("・")}｜${formatMessageDate(today)}`;
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
          `・本月到期 (${summary.expiries.length} 項)`,
          ...shown.map(({ date, subscription }) => `  ${formatMessageDate(date)} ${subscription.name}`),
          ...(hidden ? [`  ${moreText(hidden)}`] : []),
        ];
  return [
    `📅 ${summary.month.month} 月摘要`,
    ...joinBlocks([
      expiryLines,
      namedTotalLines("本月預扣", summary.reserve, cap),
      namedTotalLines("本月扣款", summary.charge, cap),
    ]),
  ];
}

/**
 * Joins blocks of lines with a blank line between each.
 *
 * @param blocks - The blocks, in order.
 */
function joinBlocks(blocks: string[][]): string[] {
  return blocks.flatMap((block, index) => [...(index > 0 ? [""] : []), ...block]);
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
    reminders.monthlySummary && summaryLines(reminders.monthlySummary, cap),
    reminders.charges.length > 0 && chargeLines(reminders.charges, cap),
    reminders.expiries.length > 0 && expiryLines(reminders.expiries, cap),
  ].filter((section): section is string[] => Array.isArray(section));
  return [headerLine(reminders), ...sections.map((lines) => lines.join("\n"))].join("\n\n");
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
