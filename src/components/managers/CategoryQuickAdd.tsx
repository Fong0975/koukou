"use client";

import { useLookupForm } from "@/hooks/useLookupForm";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { CategoryFields } from "./CategoryFields";
import { QuickAddActions } from "./QuickAddActions";

interface CategoryQuickAddProps {
  onCreate: (input: CategoryInput) => Promise<CategoryDto>;
  /** Called with the new category id after creating, or with nothing on cancel. */
  onDone: (newValue?: string) => void;
}

const EMPTY_VALUES = { name: "", icon: "" };

/** Inline form for adding a category: an optional emoji plus a name. Anything typed counts as unsaved changes. */
export function CategoryQuickAdd({ onCreate, onDone }: CategoryQuickAddProps) {
  const form = useLookupForm(EMPTY_VALUES, onCreate, (created) => onDone(String(created.id)));

  return (
    <div>
      <CategoryFields
        icon={form.values.icon}
        name={form.values.name}
        onIconChange={form.setField("icon")}
        onNameChange={form.setField("name")}
        onKeyDown={form.onKeyDown}
        nameLabel="新的類型名稱"
        namePlaceholder="新的類型名稱，例如：健身房"
      />
      <QuickAddActions
        pending={form.pending}
        error={form.error}
        onSave={() => void form.submit()}
        onCancel={() => onDone()}
      />
    </div>
  );
}
