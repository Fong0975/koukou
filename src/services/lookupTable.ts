import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { assertSameIds, planInsertion, type SortedRow, sortOrderAt } from "./sortOrder";

/** The client handed to an interactive transaction. */
export type Tx = Prisma.TransactionClient;

/** Writes one row's sortOrder. */
export type SetSortOrder = (tx: Tx, id: number, sortOrder: number) => Promise<unknown>;

/** How {@link createInOrder} reads and writes a user-ordered table such as categories or payment methods. */
export interface OrderedInsert<S extends SortedRow, R> {
  /** The rows the new one joins, in display order. */
  siblings: (tx: Tx) => Promise<S[]>;
  /** Tells whether a last row must stay last; see {@link planInsertion}. */
  staysLast?: (row: S) => boolean;
  /** Creates the row at the given sortOrder. */
  create: (tx: Tx, sortOrder: number) => Promise<R>;
  setSortOrder: SetSortOrder;
}

/**
 * Creates a row at the end of its list, or just before a last row that must stay last, which moves one
 * step down in the same transaction.
 *
 * @param table - How to read the list and write the rows.
 * @returns The created row.
 */
export function createInOrder<S extends SortedRow, R>(table: OrderedInsert<S, R>): Promise<R> {
  return prisma.$transaction(async (tx) => {
    const { sortOrder, moved } = planInsertion(await table.siblings(tx), table.staysLast);
    if (moved) await table.setSortOrder(tx, moved.id, moved.sortOrder);
    return table.create(tx, sortOrder);
  });
}

/**
 * Saves a new display order by renumbering every row's sortOrder in steps of 10. The ids are checked
 * against the table inside the same transaction, so a row added meanwhile cannot be left unnumbered.
 *
 * @param ids - Every existing id, in the desired order.
 * @param table - How to list the existing ids and write a sortOrder.
 * @param mismatchMessage - Message of the error thrown when ids differ from the existing ones.
 * @throws ValidationError when ids is not exactly the set of existing ids.
 */
export function saveDisplayOrder(
  ids: readonly number[],
  table: { listIds: (tx: Tx) => Promise<{ id: number }[]>; setSortOrder: SetSortOrder },
  mismatchMessage: string,
): Promise<void> {
  return prisma.$transaction(async (tx) => {
    const existing = await table.listIds(tx);
    assertSameIds(
      ids,
      existing.map((row) => row.id),
      mismatchMessage,
    );
    for (const [index, id] of ids.entries()) await table.setSortOrder(tx, id, sortOrderAt(index));
  });
}
