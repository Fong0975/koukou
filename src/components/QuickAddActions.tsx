interface QuickAddActionsProps {
  pending: boolean;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
  /** Save button label; defaults to "加入". */
  submitLabel?: string;
  /** Save button label while pending; defaults to "加入中…". */
  pendingLabel?: string;
}

/**
 * Save/cancel buttons and error line shared by the inline quick-add and edit forms.
 * Buttons are type="button" because these forms may live inside another <form>.
 */
export function QuickAddActions({
  pending,
  error,
  onSave,
  onCancel,
  submitLabel = "加入",
  pendingLabel = "加入中…",
}: QuickAddActionsProps) {
  return (
    <>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </>
  );
}
