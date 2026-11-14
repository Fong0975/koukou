import { CARD_COLORS, pill, softText, stripedRow } from "./cardParts";
import type { FlexNode } from "./lineMessage";

/** A pill showing an amount, in the summary card's green. */
export const amountPill = (label: string) => pill(label, CARD_COLORS.leaf.pill, CARD_COLORS.leaf.pillText);

/**
 * The names of a section, set in slightly from the title.
 *
 * @param text - The names, already joined.
 */
export function namesBlock(text: string): FlexNode {
  return { type: "box", layout: "vertical", paddingStart: "4px", contents: [softText(text)] };
}

/**
 * A pill on its own line, left-aligned and only as wide as its text.
 *
 * @param node - The pill.
 */
export const pillRow = (node: FlexNode): FlexNode => ({ type: "box", layout: "horizontal", contents: [node] });

/**
 * One row of the summary's expiry list: a date and a name.
 *
 * @param date - The formatted date.
 * @param name - The subscription's name.
 * @param index - The row's position, which picks its background.
 */
export function expiryRow(date: string, name: string, index: number): FlexNode {
  return stripedRow(CARD_COLORS.leaf.rows, index, [
    { type: "text", text: date, size: "sm", color: CARD_COLORS.inkSoft, flex: 3 },
    { type: "text", text: "｜", size: "sm", color: CARD_COLORS.leaf.divider, flex: 0 },
    { type: "text", text: name, size: "sm", color: CARD_COLORS.ink, flex: 6, wrap: true },
  ]);
}
