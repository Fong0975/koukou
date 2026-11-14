"use client";

import { useLookupManagerState } from "@/hooks/useLookupManagerState";
import { isPinnedCatchAll } from "@/lib/catchAllCategory";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { CategoryEditForm } from "./CategoryEditForm";
import { CategoryManagerRow } from "./CategoryManagerRow";
import { CategoryQuickAdd } from "./CategoryQuickAdd";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { LookupManagerList } from "./LookupManagerList";
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
 * edited but not deleted, and the "其他" catch-all stays at the end once it is last.
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
  const state = useLookupManagerState<CategoryDto>(onMove);

  return (
    <ManagerModal
      title="管理類型"
      addLabel="新增類型"
      renderAddForm={(close) => <CategoryQuickAdd onCreate={onCreate} onDone={close} />}
      isEmpty={categories.length === 0}
      emptyText="還沒有任何類型。"
      error={state.moveError}
      onClose={onClose}
      confirm={
        state.deleting && (
          <ConfirmDeleteDialog
            item={state.deleting}
            message="刪除後，這個類型會從選單中移除，無法復原。"
            onConfirm={onDelete}
            onClose={state.stopDeleting}
          />
        )
      }
    >
      <LookupManagerList
        items={categories}
        usedIds={usedCategoryIds}
        state={state}
        renderEditForm={(category, done) => <CategoryEditForm category={category} onSave={onUpdate} onDone={done} />}
        renderRow={(category, controls) => <CategoryManagerRow category={category} {...controls} />}
        isPinned={isPinnedCatchAll}
      />
    </ManagerModal>
  );
}
