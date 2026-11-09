"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { CategoryFields } from "./CategoryFields";
import { QuickAddActions, saveOnEnter } from "./QuickAddActions";

interface CategoryQuickAddProps {
  onCreate: (input: CategoryInput) => Promise<CategoryDto>;
  /** Called with the new category id after creating, or with nothing on cancel. */
  onDone: (newValue?: string) => void;
}

/** Inline form for adding a category: an optional emoji plus a name. */
export function CategoryQuickAdd({ onCreate, onDone }: CategoryQuickAddProps) {
  const [icon, setIcon] = useState("");
  const [name, setName] = useState("");
  const { pending, error, run } = useAsyncAction(onCreate);

  const save = async () => {
    const created = await run({ name, icon });
    if (created) onDone(String(created.id));
  };

  return (
    <div>
      <CategoryFields
        icon={icon}
        name={name}
        onIconChange={setIcon}
        onNameChange={setName}
        onKeyDown={saveOnEnter(() => void save())}
        nameLabel="新的類型名稱"
        namePlaceholder="新的類型名稱，例如：健身房"
      />
      <QuickAddActions pending={pending} error={error} onSave={() => void save()} onCancel={() => onDone()} />
    </div>
  );
}
