import type { ReactNode } from "react";
import { EditDeleteButtons } from "./EditDeleteButtons";
import { MoveButtons } from "./MoveButtons";

/** What a manager row shows besides its label, and the handlers of its buttons. */
export interface ManagerRowControls {
  /** A row some subscription uses can be edited but not deleted. */
  inUse: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

interface ManagerRowProps extends ManagerRowControls {
  /** Name used in the buttons' accessible labels. */
  name: string;
  /** Why the delete button is disabled while the row is in use. */
  inUseHint: string;
  /** The row's label. */
  children: ReactNode;
}

/** One row of the category or payment method manager: its label, usage badge and the move, edit and delete buttons. */
export function ManagerRow({
  name,
  inUseHint,
  inUse,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  children,
}: ManagerRowProps) {
  return (
    <div className="flex items-center gap-2">
      {children}
      {inUse && <span className="shrink-0 text-xs text-ink-soft">使用中</span>}
      <div className="flex shrink-0">
        <MoveButtons
          name={name}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
        <EditDeleteButtons name={name} inUse={inUse} inUseHint={inUseHint} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
