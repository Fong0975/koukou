"use client";

import { ConfirmDialog } from "./ConfirmDialog";

interface ConfirmDeleteDialogProps {
  item: { id: number; name: string };
  /** Explains what deleting the item removes. */
  message: string;
  onConfirm: (id: number) => Promise<void>;
  onClose: () => void;
}

/**
 * Asks before deleting an item; stays open and shows the reason if deletion fails.
 */
export function ConfirmDeleteDialog({ item, message, onConfirm, onClose }: ConfirmDeleteDialogProps) {
  return (
    <ConfirmDialog
      title={`刪除「${item.name}」？`}
      confirmLabel="刪除"
      pendingLabel="刪除中…"
      onConfirm={async () => {
        await onConfirm(item.id);
        onClose();
      }}
      onClose={onClose}
    >
      <p className="text-ink-soft">{message}</p>
    </ConfirmDialog>
  );
}
