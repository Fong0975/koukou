"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { CategoryEditForm } from "./CategoryEditForm";
import { CategoryManagerRow } from "./CategoryManagerRow";
import { CategoryQuickAdd } from "./CategoryQuickAdd";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { PlusIcon } from "./Icons";
import { Modal } from "./Modal";

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
 * edited but not deleted. The delete confirmation is a sibling dialog so it stacks above this one.
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
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<CategoryDto | null>(null);
  const move = useAsyncAction(onMove);

  return (
    <>
      <Modal
        title="管理類型"
        onClose={onClose}
        titleClassName="font-semibold"
        actions={
          !adding && (
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              <PlusIcon />
              新增類型
            </button>
          )
        }
      >
        {adding && (
          <div className="mb-4 rounded-2xl border border-dashed border-leaf-500/35 bg-leaf-50/70 p-3">
            <CategoryQuickAdd onCreate={onCreate} onDone={() => setAdding(false)} />
          </div>
        )}
        {move.error && (
          <p role="alert" className="field-error mb-3">
            {move.error}
          </p>
        )}
        {categories.length === 0 ? (
          <p className="text-ink-soft">還沒有任何類型。</p>
        ) : (
          <ul className="grid gap-3">
            {categories.map((category, index) => (
              <li key={category.id}>
                {editingId === category.id ? (
                  <CategoryEditForm category={category} onSave={onUpdate} onDone={() => setEditingId(null)} />
                ) : (
                  <CategoryManagerRow
                    category={category}
                    inUse={usedCategoryIds.has(category.id)}
                    canMoveUp={index > 0}
                    canMoveDown={index < categories.length - 1}
                    onMoveUp={() => void move.run(category.id, -1)}
                    onMoveDown={() => void move.run(category.id, 1)}
                    onEdit={() => setEditingId(category.id)}
                    onDelete={() => setDeleting(category)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {deleting && (
        <ConfirmDeleteDialog
          item={deleting}
          message="刪除後，這個類型會從選單中移除，無法復原。"
          onConfirm={onDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
