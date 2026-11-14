/** Most rows or names a card's list shows before it ends with "…另 N 項", keeping cards well below LINE's size limit. */
export const MAX_LISTED = 30;

/**
 * Keeps the first `cap` items of a list.
 *
 * @param items - The full list.
 * @param cap - Most items to keep; {@link MAX_LISTED} by default.
 * @returns The kept items, and how many were dropped.
 */
export function capList<T>(items: readonly T[], cap: number = MAX_LISTED): { shown: T[]; hidden: number } {
  const shown = items.slice(0, cap);
  return { shown, hidden: items.length - shown.length };
}

/** Says how many items a cut list left out. */
export const moreText = (hidden: number) => `…另 ${hidden} 項`;
