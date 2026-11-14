import { formatCents } from "../format/money";
import {
  amountPill,
  cardHeader,
  CARD_COLORS,
  expiryRow,
  LEAF_HEADER,
  moreRow,
  namesBlock,
  pill,
  pillRow,
  rowList,
  sectionCard,
} from "./cardParts";
import type { MonthlySummary, NamedTotal } from "./dueReminders";
import type { FlexMessage, FlexNode } from "./lineMessage";
import { formatMessageDate } from "./messageDate";
import { capList, moreText } from "./messageLayout";
import { currencyEntries, type CurrencyTotals } from "../money";

/** Most rows or names a list shows before it ends with "…另 N 項", keeping the card well below LINE's size limit. */
const MAX_LISTED = 30;

/** Describes the card in the header, under the month. */
const SUBTITLE = "本月扣款、預扣、到期一覽";

/** Formats totals per currency, e.g. "NT$ 1,290 + US$ 20.00"; the currencies are never converted into one. */
function totalsText(totals: CurrencyTotals): string {
  const entries = currencyEntries(totals);
  if (entries.length === 0) return formatCents("TWD", 0);
  return entries.map(([currency, cents]) => formatCents(currency, cents)).join(" + ");
}

/**
 * The picture under the header. The token makes every send a new URL, so the picture changes each
 * time instead of coming from a cache.
 *
 * @param token - Anything that differs between sends.
 */
function hero(token: string): FlexNode {
  return {
    type: "image",
    url: `https://picsum.photos/1024/358.jpg?random=${encodeURIComponent(token)}`,
    size: "full",
    aspectRatio: "20:7",
    aspectMode: "cover",
  };
}

/** The contract ends of the month, with their count on the title. */
function expirySection(expiries: MonthlySummary["expiries"]): FlexNode {
  const { shown, hidden } = capList(expiries, MAX_LISTED);
  const rows = shown.map(({ date, subscription }, index) =>
    expiryRow(formatMessageDate(date), subscription.name, index),
  );
  return sectionCard("⏰", "本月到期", pill(`${expiries.length} 項`, CARD_COLORS.berryBackground, CARD_COLORS.berry), [
    rowList(rows),
    ...(hidden ? [moreRow(moreText(hidden))] : []),
  ]);
}

/**
 * A section made of a total and the names it adds up. The amount sits at the title's right end, or on
 * its own line below when several currencies make it too long for the title row.
 *
 * @param icon - An emoji.
 * @param title - The section title.
 * @param named - The total and its names.
 */
function amountSection(icon: string, title: string, { totals, names }: NamedTotal): FlexNode {
  const amount = amountPill(totalsText(totals));
  const stacked = currencyEntries(totals).length > 1;
  const { shown, hidden } = capList(names, MAX_LISTED);
  const nameText = [...shown, ...(hidden ? [moreText(hidden)] : [])].join("、");
  return sectionCard(icon, title, stacked ? null : amount, [
    ...(stacked ? [pillRow(amount)] : []),
    ...(names.length > 0 ? [namesBlock(nameText)] : []),
  ]);
}

/**
 * Builds the monthly summary as a LINE card of its own. Sections without anything to report are left
 * out, except that the charge section always shows so a quiet month reads "NT$ 0".
 *
 * @param summary - The month's summary.
 * @param imageToken - Anything that differs between sends, which picks the header picture.
 */
export function buildSummaryMessage(summary: MonthlySummary, imageToken: string): FlexMessage {
  const { month, expiries, reserve, charge } = summary;
  const nothingElse = expiries.length === 0 && reserve.names.length === 0;
  const sections = [
    expiries.length > 0 && expirySection(expiries),
    reserve.names.length > 0 && amountSection("🗓️", "本月預扣", reserve),
    (charge.names.length > 0 || nothingElse) && amountSection("💳", "本月扣款", charge),
  ].filter((section): section is FlexNode => typeof section === "object");

  return {
    type: "flex",
    altText: `📅 ${month.month} 月摘要`,
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: CARD_COLORS.leaf.page } },
      header: cardHeader("📅", `${month.month} 月摘要`, SUBTITLE, LEAF_HEADER),
      hero: hero(imageToken),
      body: { type: "box", layout: "vertical", spacing: "md", paddingAll: "12px", contents: sections },
    },
  };
}
