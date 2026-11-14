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
}

/** A list of manager rows where each row can be moved, edited in place or deleted. */
export function LookupManagerList<T extends { id: number }>({
  items,
  usedIds,
  state,
  renderEditForm,
  renderRow,
}: LookupManagerListProps<T>) {
  return (
    <ul className="grid gap-3">
      {items.map((item, index) => (
        <li key={item.id}>
          {state.editingId === item.id
            ? renderEditForm(item, state.stopEditing)
            : renderRow(item, {
                inUse: usedIds.has(item.id),
                canMoveUp: !state.moving && index > 0,
                canMoveDown: !state.moving && index < items.length - 1,
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
