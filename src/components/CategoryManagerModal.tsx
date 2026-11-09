"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { CategoryEditForm } from "./CategoryEditForm";
import { CategoryManagerRow } from "./CategoryManagerRow";
import { CategoryQuickAdd } from "./CategoryQuickAdd";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ManagerModal } from "./ManagerModal";

interface CategoryManagerModalProps {
  categories: CategoryDto[];
  /** Ids of the categories some subscription uses; these cannot be deleted. */
  usedCategoryIds: ReadonlySet<number>;
  onCreate: (input: CategoryInput) => Promise<CategoryDto>;
  onUpdate: (id: number, input: CategoryInput) => Promise<CategoryDto>;
  onDelete: (id: number) => Promise<void>;
  onMove: (id: number, offset: -1 | 1) => Promise<void>;
  onClose: () => void;
}

/**
 * Dialog for adding, renaming, reordering and deleting categories. Categories in use can be
 * edited but not deleted.
 */
export function CategoryManagerModal({
  categories,
  usedCategoryIds,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
  onClose,
}: CategoryManagerModalProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<CategoryDto | null>(null);
  const move = useAsyncAction(onMove);

  return (
    <ManagerModal
      title="管理類型"
      addLabel="新增類型"
      renderAddForm={(close) => <CategoryQuickAdd onCreate={onCreate} onDone={close} />}
      isEmpty={categories.length === 0}
      emptyText="還沒有任何類型。"
      error={move.error}
      onClose={onClose}
      confirm={
        deleting && (
          <ConfirmDeleteDialog
            item={deleting}
            message="刪除後，這個類型會從選單中移除，無法復原。"
            onConfirm={onDelete}
            onClose={() => setDeleting(null)}
          />
        )
      }
    >
      <ul className="grid gap-3">
        {categories.map((category, index) => (
          <li key={category.id}>
            {editingId === category.id ? (
              <CategoryEditForm category={category} onSave={onUpdate} onDone={() => setEditingId(null)} />
            ) : (
              <CategoryManagerRow
                category={category}
                inUse={usedCategoryIds.has(category.id)}
                canMoveUp={!move.pending && index > 0}
                canMoveDown={!move.pending && index < categories.length - 1}
                onMoveUp={() => void move.run(category.id, -1)}
                onMoveDown={() => void move.run(category.id, 1)}
                onEdit={() => setEditingId(category.id)}
                onDelete={() => setDeleting(category)}
              />
            )}
          </li>
        ))}
      </ul>
    </ManagerModal>
  );
}
