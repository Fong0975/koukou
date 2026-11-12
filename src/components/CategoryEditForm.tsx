"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useReportUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { CategoryFields } from "./CategoryFields";
import { QuickAddActions, saveOnEnter } from "./QuickAddActions";

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
  const [icon, setIcon] = useState(category.icon ?? "");
  const [name, setName] = useState(category.name);
  useReportUnsavedChanges(icon !== (category.icon ?? "") || name !== category.name);
  const { pending, error, run } = useAsyncAction(onSave);

  const save = async () => {
    const saved = await run(category.id, { name, icon });
    if (saved) onDone();
  };

  return (
    <div>
      <CategoryFields
        icon={icon}
        name={name}
        onIconChange={setIcon}
        onNameChange={setName}
        onKeyDown={saveOnEnter(() => void save())}
        nameLabel="類型名稱"
      />
      <QuickAddActions
        pending={pending}
        error={error}
        onSave={() => void save()}
        onCancel={onDone}
        submitLabel="儲存"
        pendingLabel="儲存中…"
      />
    </div>
  );
}
