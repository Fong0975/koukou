"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
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
  const onKeyDown = saveOnEnter(() => void save());

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="field w-16 text-center"
          placeholder="🏷️"
          aria-label="類型圖示（可留空）"
          value={icon}
          maxLength={16}
          onChange={(event) => setIcon(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <input
          className="field"
          placeholder="新的類型名稱，例如：健身房"
          aria-label="新的類型名稱"
          value={name}
          maxLength={50}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <QuickAddActions pending={pending} error={error} onSave={() => void save()} onCancel={() => onDone()} />
    </div>
  );
}
