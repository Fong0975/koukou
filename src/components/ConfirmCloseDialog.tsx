"use client";

import { Modal } from "./Modal";

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
    <Modal title="確定要關閉嗎？" onClose={onCancel} widthClass="max-w-sm">
      <p className="text-ink-soft">還有尚未儲存的變更，關閉後將會遺失。</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          關閉
        </button>
      </div>
    </Modal>
  );
}
