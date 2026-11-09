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
