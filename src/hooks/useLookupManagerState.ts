"use client";

import { useState } from "react";
import { useAsyncAction } from "./useAsyncAction";

/**
 * State of the category or payment method manager: which row is being edited, which one awaits delete
 * confirmation, and the move action shared by every row.
 *
 * @param onMove - Moves a row one place up (-1) or down (1).
 */
export function useLookupManagerState<T>(onMove: (id: number, offset: -1 | 1) => Promise<void>) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const move = useAsyncAction(onMove);

  return {
    editingId,
    startEditing: (id: number) => setEditingId(id),
    stopEditing: () => setEditingId(null),
    deleting,
    startDeleting: (item: T) => setDeleting(item),
    stopDeleting: () => setDeleting(null),
    moving: move.pending,
    moveError: move.error,
    move: (id: number, offset: -1 | 1) => void move.run(id, offset),
  };
}

/** What {@link useLookupManagerState} returns. */
export type LookupManagerState<T> = ReturnType<typeof useLookupManagerState<T>>;
