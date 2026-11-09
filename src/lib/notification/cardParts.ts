import type { FlexNode } from "./lineMessage";

/** Colors of the LINE cards, taken from the web app's palette. */
export const CARD_COLORS = {
  ink: "#24321F",
  inkSoft: "#5B6B55",
  berry: "#C2493D",
  berryBackground: "#F8E3E0",
  leaf: {
    page: "#F6FAF3",
    card: "#EEF6EA",
    pill: "#D9ECD2",
    pillText: "#2A5A2C",
    rows: ["#E6EEE1", "#F1F6ED"],
    divider: "#B7C4B0",
  },
  coin: {
    page: "#FFFBEF",
    card: "#FFF3CC",
    pill: "#FBD96F",
    pillText: "#6B4A06",
    rows: ["#FFFBEA", "#FFF7DB"],
    amount: "#9A6A0F",
  },
} as const;

/** The colors one card is drawn in. */
export interface CardHeaderStyle {
  startColor: string;
  endColor: string;
  iconBackground: string;
  titleColor: string;
  subtitleColor: string;
}

/** Green header with white text. */
export const LEAF_HEADER: CardHeaderStyle = {
  startColor: "#4E9A4A",
  endColor: "#3F8540",
  iconBackground: "#FFFFFF33",
  titleColor: "#FFFFFF",
  subtitleColor: CARD_COLORS.leaf.card,
};

/** Yellow header with dark text, which stays readable on the light fill. */
export const COIN_HEADER: CardHeaderStyle = {
  startColor: "#FBD96F",
  endColor: "#F5C33B",
  iconBackground: "#FFFFFF66",
  titleColor: CARD_COLORS.ink,
  subtitleColor: "#5B4A12",
};

/**
 * The card's header: an icon in a circle, a title and a line under it.
 *
 * @param icon - An emoji.
 * @param title - The card's title.
 * @param subtitle - The line under the title.
 * @param style - Its colors.
 */
export function cardHeader(icon: string, title: string, subtitle: string, style: CardHeaderStyle): FlexNode {
  return {
    type: "box",
    layout: "horizontal",
    alignItems: "center",
    spacing: "md",
    paddingAll: "16px",
    background: { type: "linearGradient", angle: "135deg", startColor: style.startColor, endColor: style.endColor },
    contents: [
      {
        type: "box",
        layout: "vertical",
        width: "48px",
        height: "48px",
        cornerRadius: "24px",
        backgroundColor: style.iconBackground,
        justifyContent: "center",
        alignItems: "center",
        flex: 0,
        contents: [{ type: "text", text: icon, size: "xl", align: "center" }],
      },
      {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        flex: 1,
        contents: [
          { type: "text", text: title, weight: "bold", size: "xxl", color: style.titleColor },
          { type: "text", text: subtitle, size: "xs", color: style.subtitleColor },
        ],
      },
    ],
  };
}

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

/** A pill showing an amount, in the summary card's green. */
export const amountPill = (label: string) => pill(label, CARD_COLORS.leaf.pill, CARD_COLORS.leaf.pillText);

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
 * @param background - The card's fill color.
 */
export function sectionCard(
  icon: string,
  title: string,
  titleSide: FlexNode | null,
  content: FlexNode[],
  background: string = CARD_COLORS.leaf.card,
): FlexNode {
  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    paddingAll: "12px",
    backgroundColor: background,
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
 * Picks the background of a list row, alternating between two shades so rows stay apart.
 *
 * @param rows - The two shades of a palette.
 * @param index - The row's position.
 */
export const rowBackground = (rows: readonly [string, string], index: number) => rows[index % 2];

/**
 * Stacks rows in one rounded block.
 *
 * @param rows - The rows.
 */
export const rowList = (rows: FlexNode[]): FlexNode => ({
  type: "box",
  layout: "vertical",
  cornerRadius: "md",
  margin: "sm",
  contents: rows,
});

/**
 * One row of the summary's expiry list: a date and a name.
 *
 * @param date - The formatted date.
 * @param name - The subscription's name.
 * @param index - The row's position, which picks its background.
 */
export function expiryRow(date: string, name: string, index: number): FlexNode {
  return {
    type: "box",
    layout: "horizontal",
    backgroundColor: rowBackground(CARD_COLORS.leaf.rows, index),
    paddingAll: "10px",
    spacing: "md",
    contents: [
      { type: "text", text: date, size: "sm", color: CARD_COLORS.inkSoft, flex: 3 },
      { type: "text", text: "｜", size: "sm", color: CARD_COLORS.leaf.divider, flex: 0 },
      { type: "text", text: name, size: "sm", color: CARD_COLORS.ink, flex: 6, wrap: true },
    ],
  };
}
