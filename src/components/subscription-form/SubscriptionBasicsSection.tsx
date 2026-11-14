"use client";

import type { FieldErrors } from "@/lib/form/fieldErrors";
import type { SubscriptionDraft } from "@/lib/form/subscriptionDraft";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { CategoryDto } from "@/types/dto";
import { CategoryQuickAdd } from "../managers/CategoryQuickAdd";
import { FormSection } from "../ui/FormSection";
import { RequiredMark } from "../ui/RequiredMark";
import { SelectWithQuickAdd } from "./SelectWithQuickAdd";

/** The draft fields this section edits. */
export type BasicsFields = Pick<SubscriptionDraft, "name" | "categoryId" | "note">;

interface SubscriptionBasicsSectionProps extends BasicsFields {
  categories: CategoryDto[];
  onAddCategory: (input: CategoryInput) => Promise<CategoryDto>;
  onChange: (patch: Partial<BasicsFields>) => void;
  /** Field errors of the whole form, keyed by dotted path. */
  errors: FieldErrors;
}

/**
 * The "基本資料" group of the subscription form: its name, its category (which can be added on the spot)
 * and a note.
 */
export function SubscriptionBasicsSection(props: SubscriptionBasicsSectionProps) {
  const { name, categoryId, note, categories, onAddCategory, onChange, errors } = props;

  return (
    <FormSection title="基本資料">
      <div>
        <label htmlFor="sub-name" className="field-label">
          名稱
          <RequiredMark />
        </label>
        <input
          id="sub-name"
          className="field"
          placeholder="例如：Netflix、中華電信月租"
          value={name}
          maxLength={100}
          autoFocus
          onChange={(event) => onChange({ name: event.target.value })}
          aria-invalid={Boolean(errors.name)}
          aria-required="true"
        />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>

      <SelectWithQuickAdd
        id="sub-category"
        label="類型"
        placeholder="選擇類型"
        value={categoryId}
        onChange={(value) => onChange({ categoryId: value })}
        options={categories.map((category) => ({
          value: String(category.id),
          label: category.icon ? `${category.icon} ${category.name}` : category.name,
        }))}
        error={errors.categoryId}
        required
        addLabel="新增類型"
        renderAddForm={(done) => <CategoryQuickAdd onCreate={onAddCategory} onDone={done} />}
      />

      <div>
        <label htmlFor="sub-note" className="field-label">
          備註
        </label>
        <input
          id="sub-note"
          className="field"
          placeholder="例如：家庭方案，和家人分攤"
          value={note}
          maxLength={255}
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </div>
    </FormSection>
  );
}
