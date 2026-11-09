import type { CategoryDto } from "@/types/dto";
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon } from "./Icons";

interface CategoryManagerRowProps {
  category: CategoryDto;
  /** A category some subscription uses can be edited but not deleted. */
  inUse: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** One category in the manager: its label, usage badge and the move, edit and delete buttons. */
export function CategoryManagerRow({
  category,
  inUse,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: CategoryManagerRowProps) {
  const { name } = category;

  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="w-7 shrink-0 text-center text-lg">
        {category.icon ?? "🏷️"}
      </span>
      <span className="min-w-0 flex-1 font-medium break-words">{name}</span>
      {inUse && <span className="shrink-0 text-xs text-ink-soft">使用中</span>}
      <div className="flex shrink-0">
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label={`上移「${name}」`}
        >
          <ChevronUpIcon />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label={`下移「${name}」`}
        >
          <ChevronDownIcon />
        </button>
        <button type="button" className="icon-btn icon-btn-sm" onClick={onEdit} aria-label={`編輯「${name}」`}>
          <PencilIcon />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          onClick={onDelete}
          disabled={inUse}
          title={inUse ? "使用中的類型無法刪除" : undefined}
          aria-label={`刪除「${name}」`}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
