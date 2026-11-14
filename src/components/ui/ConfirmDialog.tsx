"use client";

import type { ReactNode } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  /** Label of the confirm button. */
  confirmLabel: string;
  /** Label of the confirm button while `onConfirm` runs; the confirm label by default. */
  pendingLabel?: string;
  /** Runs when confirmed; a rejection keeps the dialog open and shows its message. */
  onConfirm: () => void | Promise<void>;
  /** Cancels; also what the close button, Esc and a backdrop click do. */
  onClose: () => void;
  /** Explains what confirming does. */
  children: ReactNode;
}

/**
 * Small dialog asking to confirm a destructive action, with cancel and confirm buttons. While the action
 * runs the confirm button is disabled; if it fails the dialog stays open and shows why.
 */
export function ConfirmDialog({
  title,
  confirmLabel,
  pendingLabel = confirmLabel,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const { pending, error, run } = useAsyncAction(async () => {
    await onConfirm();
  });

  return (
    <Modal title={title} onClose={onClose} widthClass="max-w-sm">
      {children}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          取消
        </button>
        <button type="button" className="btn btn-danger" onClick={() => void run()} disabled={pending}>
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
