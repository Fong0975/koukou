"use client";

import { useAsyncAction } from "@/hooks/useAsyncAction";
import { Modal } from "./Modal";

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
  const { pending, error, run } = useAsyncAction(async () => {
    await onConfirm(item.id);
    onClose();
  });

  return (
    <Modal title={`刪除「${item.name}」？`} onClose={onClose} widthClass="max-w-sm">
      <p className="text-ink-soft">{message}</p>
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
          {pending ? "刪除中…" : "刪除"}
        </button>
      </div>
    </Modal>
  );
}
