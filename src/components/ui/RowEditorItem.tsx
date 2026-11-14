import type { ReactNode } from "react";
import { CloseIcon } from "./Icons";

interface RowEditorItemProps {
  /** Accessible label of the remove button, e.g. "移除第 1 段暫停". */
  removeLabel: string;
  onRemove: () => void;
  /** The row's first error, shown under it. */
  error?: string;
  /** The row's inputs. */
  children: ReactNode;
}

/** One row of an editable list such as the pauses or past amounts: its inputs, a remove button and its error. */
export function RowEditorItem({ removeLabel, onRemove, error, children }: RowEditorItemProps) {
  return (
    <li>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <button type="button" className="icon-btn" onClick={onRemove} aria-label={removeLabel}>
          <CloseIcon />
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </li>
  );
}
