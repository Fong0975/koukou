/** Name of the catch-all category that stays at the end of the list once it is last. */
export const CATCH_ALL_CATEGORY_NAME = "其他";

/**
 * Tells whether a category is the "其他" catch-all.
 *
 * @param category - The category, or any row carrying its name.
 */
export function isCatchAllCategory(category: { name: string }): boolean {
  return category.name === CATCH_ALL_CATEGORY_NAME;
}

/**
 * Tells whether the category at a position is the catch-all pinned at the end: it is the last one and
 * named "其他". A catch-all elsewhere is not pinned, so it can still be moved to the end.
 *
 * @param categories - The categories in display order.
 * @param index - The position to check.
 */
export function isPinnedCatchAll(categories: readonly { name: string }[], index: number): boolean {
  return index === categories.length - 1 && isCatchAllCategory(categories[index]);
}
