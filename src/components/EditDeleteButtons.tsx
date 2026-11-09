import { PencilIcon, TrashIcon } from "./Icons";

interface EditDeleteButtonsProps {
  /** Name of the item, used in the buttons' accessible labels. */
  name: string;
  /** An item in use can be edited but not deleted. */
  inUse: boolean;
  /** Tooltip explaining why the delete button is disabled. */
  inUseHint: string;
  onEdit: () => void;
  onDelete: () => void;
}

/** The edit and delete icon buttons of a manager row; delete is disabled while the item is in use. */
export function EditDeleteButtons({ name, inUse, inUseHint, onEdit, onDelete }: EditDeleteButtonsProps) {
  return (
    <>
      <button type="button" className="icon-btn icon-btn-sm" onClick={onEdit} aria-label={`編輯「${name}」`}>
        <PencilIcon />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn-sm"
        onClick={onDelete}
        disabled={inUse}
        title={inUse ? inUseHint : undefined}
        aria-label={`刪除「${name}」`}
      >
        <TrashIcon />
      </button>
    </>
  );
}
