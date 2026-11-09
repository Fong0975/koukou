/** Most characters LINE shows in one text message. */
export const MAX_MESSAGE_LENGTH = 5000;

/**
 * Keeps the first `cap` items of a list.
 *
 * @param items - The full list.
 * @param cap - Most items to keep.
 * @returns The kept items, and how many were dropped.
 */
export function capList<T>(items: readonly T[], cap: number): { shown: T[]; hidden: number } {
  const shown = items.slice(0, cap);
  return { shown, hidden: items.length - shown.length };
}

/** Says how many items a cut list left out. */
export const moreText = (hidden: number) => `…另 ${hidden} 項`;

/**
 * Joins blocks of lines with a blank line between each.
 *
 * @param blocks - The blocks, in order.
 */
export function joinBlocks(blocks: string[][]): string[] {
  return blocks.flatMap((block, index) => [...(index > 0 ? [""] : []), ...block]);
}

/**
 * Renders a message with every list cut to the most items that still fit in
 * {@link MAX_MESSAGE_LENGTH} characters, so the message always shows in full.
 *
 * @param render - Renders the message with every list cut to at most the given number of items.
 * @param longestList - Length of the longest list, which bounds the cap worth trying.
 * @returns The message.
 */
export function fitToLimit(render: (cap: number) => string, longestList: number): string {
  let low = 0;
  let high = longestList;
  const full = render(high);
  if (full.length <= MAX_MESSAGE_LENGTH) return full;

  // Binary search for the largest cap that fits; the length grows with the cap.
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (render(mid).length <= MAX_MESSAGE_LENGTH) low = mid;
    else high = mid - 1;
  }
  const message = render(low);
  // Only headers and fixed lines remain at this point; cutting them is a last resort that keeps the send from failing.
  return message.length <= MAX_MESSAGE_LENGTH ? message : `${message.slice(0, MAX_MESSAGE_LENGTH - 1)}…`;
}
