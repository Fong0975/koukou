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
