import type { FlexNode } from "./lineMessage";

/** Colors of the summary card, taken from the web app's palette. */
export const CARD_COLORS = {
  page: "#F6FAF3",
  card: "#EEF6EA",
  ink: "#24321F",
  inkSoft: "#5B6B55",
  leaf: "#4E9A4A",
  leafDark: "#3F8540",
  amountBackground: "#D9ECD2",
  amountText: "#2A5A2C",
  berry: "#C2493D",
  berryBackground: "#F8E3E0",
  rowDark: "#E6EEE1",
  rowLight: "#F1F6ED",
  divider: "#B7C4B0",
} as const;

/**
 * A rounded label, e.g. an amount or a count.
 *
 * @param label - The text.
 * @param background - Fill color.
 * @param color - Text color.
 */
export function pill(label: string, background: string, color: string): FlexNode {
  return {
    type: "box",
    layout: "vertical",
    flex: 0,
    backgroundColor: background,
    cornerRadius: "xl",
    paddingTop: "4px",
    paddingBottom: "4px",
    paddingStart: "12px",
    paddingEnd: "12px",
    contents: [{ type: "text", text: label, size: "sm", weight: "bold", color }],
  };
}

/** A pill showing an amount. */
export const amountPill = (label: string) => pill(label, CARD_COLORS.amountBackground, CARD_COLORS.amountText);

/**
 * A small text in the card's secondary color.
 *
 * @param text - The text.
 * @param margin - Space above it.
 */
function softText(text: string, margin?: string): FlexNode {
  return { type: "text", text, size: "sm", color: CARD_COLORS.inkSoft, wrap: true, ...(margin ? { margin } : {}) };
}

/**
 * The names of a section, set in slightly from the title.
 *
 * @param text - The names, already joined.
 */
export function namesBlock(text: string): FlexNode {
  return { type: "box", layout: "vertical", paddingStart: "4px", contents: [softText(text)] };
}

/**
 * Says how many items a cut list left out, under the list.
 *
 * @param text - The text, e.g. "…另 3 項".
 */
export const moreRow = (text: string) => softText(text, "sm");

/**
 * A rounded card with an icon and title on top, and its content below.
 *
 * @param icon - An emoji.
 * @param title - The section title.
 * @param titleSide - A pill at the title's right end, if any.
 * @param content - Components below the title.
 */
export function sectionCard(icon: string, title: string, titleSide: FlexNode | null, content: FlexNode[]): FlexNode {
  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    paddingAll: "12px",
    backgroundColor: CARD_COLORS.card,
    cornerRadius: "xl",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        alignItems: "center",
        spacing: "md",
        contents: [
          { type: "text", text: icon, size: "xl", flex: 0 },
          { type: "text", text: title, weight: "bold", size: "lg", color: CARD_COLORS.ink, flex: 1 },
          ...(titleSide ? [titleSide] : []),
        ],
      },
      ...content,
    ],
  };
}

/**
 * A pill on its own line, left-aligned and only as wide as its text.
 *
 * @param node - The pill.
 */
export const pillRow = (node: FlexNode): FlexNode => ({ type: "box", layout: "horizontal", contents: [node] });

/**
 * One row of the expiry list: a date and a name, with the rows' background alternating.
 *
 * @param date - The formatted date.
 * @param name - The subscription's name.
 * @param index - The row's position, which picks its background.
 */
export function expiryRow(date: string, name: string, index: number): FlexNode {
  return {
    type: "box",
    layout: "horizontal",
    backgroundColor: index % 2 === 0 ? CARD_COLORS.rowDark : CARD_COLORS.rowLight,
    paddingAll: "10px",
    spacing: "md",
    contents: [
      { type: "text", text: date, size: "sm", color: CARD_COLORS.inkSoft, flex: 3 },
      { type: "text", text: "｜", size: "sm", color: CARD_COLORS.divider, flex: 0 },
      { type: "text", text: name, size: "sm", color: CARD_COLORS.ink, flex: 6, wrap: true },
    ],
  };
}

/**
 * The expiry rows in one rounded block.
 *
 * @param rows - The rows from {@link expiryRow}.
 */
export const expiryList = (rows: FlexNode[]): FlexNode => ({
  type: "box",
  layout: "vertical",
  cornerRadius: "md",
  margin: "sm",
  contents: rows,
});
