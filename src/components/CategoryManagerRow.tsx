import type { CategoryDto } from "@/types/dto";
import { EditDeleteButtons } from "./EditDeleteButtons";
import { MoveButtons } from "./MoveButtons";

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
        <MoveButtons
          name={name}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
        <EditDeleteButtons
          name={name}
          inUse={inUse}
          inUseHint="使用中的類型無法刪除"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
