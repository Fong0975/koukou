"use client";

import { useState, type ReactNode } from "react";
import { PlusIcon } from "./Icons";
import { Modal } from "./Modal";

interface ManagerModalProps {
  title: string;
  /** Label of the header button that opens the add form. */
  addLabel: string;
  /** Renders the add form; call `close` to hide it again. */
  renderAddForm: (close: () => void) => ReactNode;
  isEmpty: boolean;
  emptyText: string;
  /** Error from a row action such as moving, shown above the list. */
  error?: string | null;
  /** Dialogs opened from the rows, e.g. the delete confirmation. They render beside this one so they stack above it. */
  confirm?: ReactNode;
  onClose: () => void;
  /** The lists of rows, shown unless `isEmpty`. */
  children: ReactNode;
}

/**
 * Frame shared by the category and payment method managers: a header button that reveals an
 * inline add form, an empty state, and the lists of rows.
 */
export function ManagerModal({
  title,
  addLabel,
  renderAddForm,
  isEmpty,
  emptyText,
  error,
  confirm,
  onClose,
  children,
}: ManagerModalProps) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <Modal
        title={title}
        onClose={onClose}
        titleClassName="font-semibold"
        actions={
          !adding && (
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              <PlusIcon />
              {addLabel}
            </button>
          )
        }
      >
        {adding && (
          <div className="mb-4 rounded-2xl border border-dashed border-leaf-500/35 bg-leaf-50/70 p-3">
            {renderAddForm(() => setAdding(false))}
          </div>
        )}
        {error && (
          <p role="alert" className="field-error mb-3">
            {error}
          </p>
        )}
        {isEmpty ? <p className="text-ink-soft">{emptyText}</p> : children}
      </Modal>
      {confirm}
    </>
  );
}
