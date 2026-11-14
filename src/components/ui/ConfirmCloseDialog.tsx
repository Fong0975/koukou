"use client";

import { ConfirmDialog } from "./ConfirmDialog";

interface ConfirmCloseDialogProps {
  /** Closes the dialog being edited, discarding its changes. */
  onConfirm: () => void;
  /** Dismisses this question and returns to editing. */
  onCancel: () => void;
}

/**
 * Asks before closing a dialog that still has unsaved changes. Its close button, Esc and a
 * backdrop click all return to editing.
 *
 * @param props.onConfirm - Discards the changes and closes the edited dialog.
 * @param props.onCancel - Returns to editing.
 */
export function ConfirmCloseDialog({ onConfirm, onCancel }: ConfirmCloseDialogProps) {
  return (
    <ConfirmDialog title="確定要關閉嗎？" confirmLabel="關閉" onConfirm={onConfirm} onClose={onCancel}>
      <p className="text-ink-soft">還有尚未儲存的變更，關閉後將會遺失。</p>
    </ConfirmDialog>
  );
}
