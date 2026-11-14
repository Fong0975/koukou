"use client";

import { useState } from "react";
import { UnsavedChangesContext, useUnsavedChangesTracker } from "@/hooks/useUnsavedChanges";
import { ConfirmCloseDialog } from "./ConfirmCloseDialog";
import { Modal, type ModalProps } from "./Modal";

interface GuardedModalProps extends ModalProps {
  /** Whether the dialog's own form has unsaved changes; forms inside can also report theirs via `useReportUnsavedChanges`. */
  dirty?: boolean;
}

/**
 * A `Modal` for editing that asks before its close button, Esc or a backdrop click discards unsaved
 * changes. Buttons inside that call `onClose` directly, such as 取消 or a successful save, close it
 * without asking.
 *
 * @param props.dirty - Whether the dialog's own form has unsaved changes.
 * @param props.onClose - Closes the dialog.
 */
export function GuardedModal({ dirty = false, onClose, ...modalProps }: GuardedModalProps) {
  const tracker = useUnsavedChangesTracker();
  const [confirming, setConfirming] = useState(false);

  const requestClose = () => {
    if (dirty || tracker.dirty) setConfirming(true);
    else onClose();
  };

  return (
    <UnsavedChangesContext.Provider value={tracker.report}>
      <Modal {...modalProps} onClose={requestClose} />
      {confirming && <ConfirmCloseDialog onConfirm={onClose} onCancel={() => setConfirming(false)} />}
    </UnsavedChangesContext.Provider>
  );
}
