/** A form row with a stable React key, e.g. a pause or a past amount draft. */
interface KeyedRow {
  key: string;
}

/**
 * Changes some fields of one row of a list, keeping the others as they are.
 *
 * @param rows - The rows.
 * @param key - The row to change.
 * @param values - The fields to change.
 * @returns A new list.
 */
export function patchRow<T extends KeyedRow>(rows: readonly T[], key: string, values: Partial<T>): T[] {
  return rows.map((row) => (row.key === key ? { ...row, ...values } : row));
}

/**
 * Drops one row of a list.
 *
 * @param rows - The rows.
 * @param key - The row to drop.
 * @returns A new list.
 */
export function removeRow<T extends KeyedRow>(rows: readonly T[], key: string): T[] {
  return rows.filter((row) => row.key !== key);
}
