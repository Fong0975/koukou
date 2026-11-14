import type { ReactNode } from "react";
import type { LookupManagerState } from "@/hooks/useLookupManagerState";
import type { ManagerRowControls } from "./ManagerRow";

interface LookupManagerListProps<T extends { id: number }> {
  /** The rows in display order; moving is limited to this list. */
  items: readonly T[];
  /** Ids of the rows some subscription uses; these cannot be deleted. */
  usedIds: ReadonlySet<number>;
  state: LookupManagerState<T>;
  /** Renders the inline edit form of the row being edited; call `done` to close it. */
  renderEditForm: (item: T, done: () => void) => ReactNode;
  /** Renders a row with its controls wired to the manager state. */
  renderRow: (item: T, controls: ManagerRowControls) => ReactNode;
  /** Tells whether the row at a position is fixed in place; it cannot move, nor can its neighbours swap with it. */
  isPinned?: (items: readonly T[], index: number) => boolean;
}

const NEVER_PINNED = () => false;

/** A list of manager rows where each row can be moved, edited in place or deleted; pinned rows stay in place. */
export function LookupManagerList<T extends { id: number }>({
  items,
  usedIds,
  state,
  renderEditForm,
  renderRow,
  isPinned = NEVER_PINNED,
}: LookupManagerListProps<T>) {
  /** Whether the row at `index` may swap places with the row at `index + offset`. */
  const canSwap = (index: number, offset: -1 | 1) => {
    const other = index + offset;
    return !state.moving && other >= 0 && other < items.length && !isPinned(items, index) && !isPinned(items, other);
  };

  return (
    <ul className="grid gap-3">
      {items.map((item, index) => (
        <li key={item.id}>
          {state.editingId === item.id
            ? renderEditForm(item, state.stopEditing)
            : renderRow(item, {
                inUse: usedIds.has(item.id),
                canMoveUp: canSwap(index, -1),
                canMoveDown: canSwap(index, 1),
                onMoveUp: () => state.move(item.id, -1),
                onMoveDown: () => state.move(item.id, 1),
                onEdit: () => state.startEditing(item.id),
                onDelete: () => state.startDeleting(item),
              })}
        </li>
      ))}
    </ul>
  );
}
