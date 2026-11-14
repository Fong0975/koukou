import type { FlexMessage, FlexNode } from "./lineMessage";
import { moreText } from "./messageLayout";

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
interface CardHeaderStyle {
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

/**
 * A small text in the card's secondary color.
 *
 * @param text - The text.
 * @param margin - Space above it.
 */
export function softText(text: string, margin?: string): FlexNode {
  return { type: "text", text, size: "sm", color: CARD_COLORS.inkSoft, wrap: true, ...(margin ? { margin } : {}) };
}

/**
 * Says how many items a cut list left out, under the list.
 *
 * @param text - The text, e.g. "…另 3 項".
 */
export const moreRow = (text: string) => softText(text, "sm");

/**
 * The line under a cut list that says how many items it left out, or nothing when the list is whole.
 *
 * @param hidden - How many items were left out.
 */
export const moreRows = (hidden: number): FlexNode[] => (hidden > 0 ? [moreRow(moreText(hidden))] : []);

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
 * One row of a list: its contents side by side on a background that alternates with the next row's.
 *
 * @param rows - The two shades of a palette.
 * @param index - The row's position, which picks its background.
 * @param contents - The row's components.
 * @param extra - More properties of the row box, e.g. its alignment.
 */
export function stripedRow(
  rows: readonly [string, string],
  index: number,
  contents: FlexNode[],
  extra: Record<string, unknown> = {},
): FlexNode {
  return {
    type: "box",
    layout: "horizontal",
    ...extra,
    backgroundColor: rowBackground(rows, index),
    paddingAll: "10px",
    spacing: "md",
    contents,
  };
}

/** What {@link flexCard} builds a card from. */
export interface FlexCardParts {
  /** Shown in the notification and chat list in place of the card. */
  altText: string;
  header: FlexNode;
  /** A picture under the header, if any. */
  hero?: FlexNode;
  /** The fill color behind the sections. */
  background: string;
  /** The sections, where `false` marks one left out because it has nothing to report. */
  sections: (FlexNode | false)[];
}

/**
 * Builds a card of stacked sections, leaving out the ones marked `false`.
 *
 * @param parts - The card's header, picture, background and sections.
 */
export function flexCard({ altText, header, hero, background, sections }: FlexCardParts): FlexMessage {
  return {
    type: "flex",
    altText,
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: background } },
      header,
      ...(hero ? { hero } : {}),
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "12px",
        contents: sections.filter((section): section is FlexNode => section !== false),
      },
    },
  };
}
