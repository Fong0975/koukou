import { PencilIcon, TrashIcon } from "../ui/Icons";

interface EditDeleteButtonsProps {
  /** Name of the item, used in the buttons' accessible labels. */
  name: string;
  /** An item in use can be edited but not deleted. */
  inUse: boolean;
  /** Tooltip explaining why the delete button is disabled. */
  inUseHint: string;
  /** Set for an item that can be neither edited nor deleted; the tooltip of both disabled buttons. */
  lockedHint?: string;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * The edit and delete icon buttons of a manager row; delete is disabled while the item is in use, and both are
 * disabled for a locked item.
 */
export function EditDeleteButtons({ name, inUse, inUseHint, lockedHint, onEdit, onDelete }: EditDeleteButtonsProps) {
  const locked = lockedHint !== undefined;
  const deleteHint = lockedHint ?? (inUse ? inUseHint : undefined);

  return (
    <>
      <button
        type="button"
        className="icon-btn icon-btn-sm"
        onClick={onEdit}
        disabled={locked}
        title={lockedHint}
        aria-label={`編輯「${name}」`}
      >
        <PencilIcon />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn-sm"
        onClick={onDelete}
        disabled={locked || inUse}
        title={deleteHint}
        aria-label={`刪除「${name}」`}
      >
        <TrashIcon />
      </button>
    </>
  );
}
