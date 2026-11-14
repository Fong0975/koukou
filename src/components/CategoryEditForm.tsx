"use client";

import { useLookupForm } from "@/hooks/useLookupForm";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { CategoryFields } from "./CategoryFields";
import { QuickAddActions } from "./QuickAddActions";

interface CategoryEditFormProps {
  category: CategoryDto;
  onSave: (id: number, input: CategoryInput) => Promise<CategoryDto>;
  /** Called after a successful save or when the edit is cancelled. */
  onDone: () => void;
}

/**
 * Inline form for changing a category's emoji and name; stays open and shows the reason if saving fails.
 * Values that differ from the category's count as unsaved changes.
 */
export function CategoryEditForm({ category, onSave, onDone }: CategoryEditFormProps) {
  const form = useLookupForm(
    { name: category.name, icon: category.icon ?? "" },
    (values) => onSave(category.id, values),
    onDone,
  );

  return (
    <div>
      <CategoryFields
        icon={form.values.icon}
        name={form.values.name}
        onIconChange={form.setField("icon")}
        onNameChange={form.setField("name")}
        onKeyDown={form.onKeyDown}
        nameLabel="類型名稱"
      />
      <QuickAddActions
        pending={form.pending}
        error={form.error}
        onSave={() => void form.submit()}
        onCancel={onDone}
        submitLabel="儲存"
        pendingLabel="儲存中…"
      />
    </div>
  );
}
