import { formatAmountText } from "../format";
import { CARD_COLORS, cardHeader, COIN_HEADER, moreRow, pill, rowBackground, rowList, sectionCard } from "./cardParts";
import { hasNoReminders, type ChargeReminder, type DailyReminders, type ExpiryReminder } from "./dueReminders";
import type { FlexMessage, FlexNode } from "./lineMessage";
import { formatMessageDate, formatMonthDay, formatPaddedDate, whenText } from "./messageDate";
import { capList, moreText } from "./messageLayout";

/** Most rows a list shows before it ends with "…另 N 項", keeping the card well below LINE's size limit. */
const MAX_LISTED = 30;

const COIN = CARD_COLORS.coin;

/**
 * Says what the card holds and when, e.g. "扣款 2 筆・到期 1 項｜12/1 (二)". It is also the card's
 * alt text, which LINE shows in the notification and chat list.
 *
 * @param reminders - The day's reminders, counted in full even when lists are cut.
 */
function summaryLine({ today, charges, expiries }: DailyReminders): string {
  const parts = [
    charges.length > 0 && `扣款 ${charges.length} 筆`,
    expiries.length > 0 && `到期 ${expiries.length} 項`,
  ].filter((part): part is string => typeof part === "string");
  return `${parts.join("・")}｜${formatMessageDate(today)}`;
}

/** A pill counting a section's items. */
const countPill = (label: string) => pill(label, COIN.pill, COIN.pillText);

/** The bold name of a subscription in a row. */
const nameText = (name: string): FlexNode => ({
  type: "text",
  text: name,
  size: "sm",
  weight: "bold",
  color: CARD_COLORS.ink,
  flex: 1,
  wrap: true,
});

/**
 * Says how far a contract's end is, set apart in red on the day itself; later days show the date
 * small in parentheses.
 *
 * @param expiry - The contract end.
 */
function expiryWhen({ date, daysBefore }: ExpiryReminder): FlexNode {
  if (daysBefore === 0) {
    return { type: "text", text: whenText(0), size: "sm", weight: "bold", color: CARD_COLORS.berry, flex: 0 };
  }
  return {
    type: "text",
    contents: [
      { type: "span", text: `${whenText(daysBefore)} ` },
      { type: "span", text: `(${formatMonthDay(date)})`, size: "xxs" },
    ],
    size: "sm",
    color: CARD_COLORS.inkSoft,
    flex: 0,
  };
}

/**
 * The contract ends to remind of.
 *
 * @param expiries - The contract ends, in order.
 */
function expirySection(expiries: ExpiryReminder[]): FlexNode {
  const { shown, hidden } = capList(expiries, MAX_LISTED);
  const rows = shown.map((expiry, index) => ({
    type: "box",
    layout: "horizontal",
    alignItems: "center",
    backgroundColor: rowBackground(COIN.rows, index),
    paddingAll: "10px",
    spacing: "md",
    contents: [nameText(expiry.subscription.name), expiryWhen(expiry)],
  }));
  return sectionCard(
    "⏰",
    "到期",
    countPill(`${expiries.length} 項`),
    [rowList(rows), ...(hidden ? [moreRow(moreText(hidden))] : [])],
    COIN.card,
  );
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

/** One charge: its name and payment method on the left, its amount on the right. */
function chargeRow({ subscription, amount }: ChargeReminder, index: number): FlexNode {
  return {
    type: "box",
    layout: "horizontal",
    alignItems: "center",
    backgroundColor: rowBackground(COIN.rows, index),
    paddingAll: "10px",
    spacing: "md",
    contents: [
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        contents: [
          nameText(subscription.name),
          { type: "text", text: subscription.paymentMethod.name, size: "xs", color: CARD_COLORS.inkSoft },
        ],
      },
      {
        type: "text",
        text: formatAmountText(subscription.currency, amount),
        size: "sm",
        weight: "bold",
        color: COIN.amount,
        flex: 0,
      },
    ],
  };
}

/**
 * The charges of one date: the date and how far away it is, then each charge.
 *
 * @param group - Charges on the same date.
 */
function chargeGroup(group: ChargeReminder[]): FlexNode[] {
  const { date, daysBefore } = group[0];
  return [
    {
      type: "text",
      text: `${formatPaddedDate(date)}・${whenText(daysBefore)}`,
      size: "sm",
      weight: "bold",
      color: daysBefore === 0 ? CARD_COLORS.berry : CARD_COLORS.inkSoft,
      margin: "md",
    },
    { ...rowList(group.map(chargeRow)), margin: "none" },
  ];
}

/**
 * The charges to remind of, grouped by date.
 *
 * @param charges - The charges, sorted by date.
 */
function chargeSection(charges: ChargeReminder[]): FlexNode {
  const { shown, hidden } = capList(charges, MAX_LISTED);
  return sectionCard(
    "💳",
    "扣款提醒",
    countPill(`${charges.length} 筆`),
    [...groupByDate(shown).flatMap(chargeGroup), ...(hidden ? [moreRow(moreText(hidden))] : [])],
    COIN.card,
  );
}

/**
 * Builds the day's reminders as a LINE card: contract ends first, then charges. Sections without
 * anything to report are left out.
 *
 * @param reminders - The day's reminders.
 * @returns The card, or null when there is nothing to send.
 */
export function buildReminderCard(reminders: DailyReminders): FlexMessage | null {
  if (hasNoReminders(reminders)) return null;
  const sections = [
    reminders.expiries.length > 0 && expirySection(reminders.expiries),
    reminders.charges.length > 0 && chargeSection(reminders.charges),
  ].filter((section): section is FlexNode => typeof section === "object");
  const line = summaryLine(reminders);

  return {
    type: "flex",
    altText: `🔔 ${line}`,
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: COIN.page } },
      header: cardHeader("🔔", "今日提醒", line, COIN_HEADER),
      body: { type: "box", layout: "vertical", spacing: "md", paddingAll: "12px", contents: sections },
    },
  };
}
