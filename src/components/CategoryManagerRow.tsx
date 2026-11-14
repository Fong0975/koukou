import type { CategoryDto } from "@/types/dto";
import { ManagerRow, type ManagerRowControls } from "./ManagerRow";

interface CategoryManagerRowProps extends ManagerRowControls {
  category: CategoryDto;
}

/** One category in the manager: its emoji and name, usage badge and the move, edit and delete buttons. */
export function CategoryManagerRow({ category, ...controls }: CategoryManagerRowProps) {
  return (
    <ManagerRow name={category.name} inUseHint="使用中的類型無法刪除" {...controls}>
      <span aria-hidden className="w-7 shrink-0 text-center text-lg">
        {category.icon ?? "🏷️"}
      </span>
      <span className="min-w-0 flex-1 font-medium break-words">{category.name}</span>
    </ManagerRow>
  );
}
