import { ValidationError } from "@/lib/errors";

/** Gap between the sortOrder values written by a reorder, leaving room for rows added later. */
const SORT_ORDER_STEP = 10;

/**
 * The sortOrder a row gets when it ends up at a position of a reordered list.
 *
 * @param index - Zero-based position in the new order.
 */
export const sortOrderAt = (index: number): number => (index + 1) * SORT_ORDER_STEP;

/**
 * Checks that a reorder request lists every existing id exactly once.
 *
 * @param ids - The ids in the requested order.
 * @param existingIds - The ids currently in the database.
 * @param message - Message of the error thrown when they differ.
 * @throws ValidationError when ids is missing, repeats or adds an id.
 */
export function assertSameIds(ids: readonly number[], existingIds: readonly number[], message: string): void {
  const existing = new Set(existingIds);
  const isExactSet =
    ids.length === existing.size && new Set(ids).size === ids.length && ids.every((id) => existing.has(id));
  if (!isExactSet) throw new ValidationError(message);
}

/** A row's id and position. */
export interface SortedRow {
  id: number;
  sortOrder: number;
}

/** Where a new row goes, and the row that moves one step down to make room for it, if any. */
export interface Insertion {
  sortOrder: number;
  moved?: SortedRow;
}

/**
 * Picks the sortOrder of a row added to a list: one step after the last row, or in the place of a last row
 * that must stay last (such as the "其他" catch-all), which then moves one step down. Rows sharing a sortOrder
 * are shown by id, so the new row still lands after the rows before that place.
 *
 * @param rows - The list the row is added to, in display order.
 * @param staysLast - Tells whether a last row must stay last; none does by default.
 */
export function planInsertion<T extends SortedRow>(
  rows: readonly T[],
  staysLast: (row: T) => boolean = () => false,
): Insertion {
  const last = rows.at(-1);
  if (!last) return { sortOrder: SORT_ORDER_STEP };
  if (staysLast(last)) {
    return { sortOrder: last.sortOrder, moved: { id: last.id, sortOrder: last.sortOrder + SORT_ORDER_STEP } };
  }
  return { sortOrder: last.sortOrder + SORT_ORDER_STEP };
}
