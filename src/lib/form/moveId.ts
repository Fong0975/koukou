/**
 * Moves one id a step up or down a list of ids.
 *
 * @param ids - The ids in their current order.
 * @param id - The id to move.
 * @param offset - -1 to move it earlier, 1 to move it later.
 * @returns The new order, or null when the id is absent or already at that end of the list.
 */
export function moveId(ids: readonly number[], id: number, offset: -1 | 1): number[] | null {
  const from = ids.indexOf(id);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= ids.length) return null;

  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
