"use client";

import type { PendingImport } from "@/hooks/useBackup";
import { formatTimestamp } from "@/lib/format/date";
import { ConfirmDialog } from "./ConfirmDialog";

interface ConfirmImportDialogProps {
  pending: PendingImport;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/**
 * Shows what a chosen backup file holds and asks before it replaces all current data; stays open
 * and shows the reason if the import fails.
 *
 * @param props.pending - The chosen file and its summary.
 * @param props.onConfirm - Imports the file.
 * @param props.onClose - Closes the dialog, also after a successful import.
 */
export function ConfirmImportDialog({ pending, onConfirm, onClose }: ConfirmImportDialogProps) {
  const { fileName, preview } = pending;

  // Rows without a value, e.g. a file missing its export time, are left out.
  const rows = [
    { label: "檔案", value: fileName },
    { label: "匯出時間", value: preview.exportedAt && formatTimestamp(preview.exportedAt) },
    { label: "匯出版本", value: preview.appVersion },
    { label: "類型", value: `${preview.counts.categories} 筆` },
    { label: "扣款方式", value: `${preview.counts.paymentMethods} 筆` },
    { label: "扣款項目", value: `${preview.counts.subscriptions} 筆` },
  ].filter((row) => row.value);

  return (
    <ConfirmDialog
      title="匯入備份？"
      confirmLabel="匯入"
      pendingLabel="匯入中…"
      onConfirm={async () => {
        await onConfirm();
        onClose();
      }}
      onClose={onClose}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="contents">
            <dt className="text-ink-soft">{label}</dt>
            <dd className="font-num break-all">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-ink-soft">匯入後，目前所有的類型、扣款方式和扣款項目都會被備份檔的內容取代，無法復原。</p>
    </ConfirmDialog>
  );
}
