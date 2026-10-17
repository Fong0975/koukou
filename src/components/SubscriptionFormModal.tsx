"use client";

import { useState, type FormEvent } from "react";
import type { Currency } from "@/generated/prisma/enums";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { todayKey } from "@/lib/dateKey";
import { CURRENCY_LABELS, CURRENCY_PREFIX, PAYMENT_TYPE_LABELS } from "@/lib/labels";
import {
  draftFromDto,
  draftToInput,
  emptyDraft,
  toFieldErrors,
  type FieldErrors,
  type SubscriptionDraft,
} from "@/lib/subscriptionDraft";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import { subscriptionInputSchema, type SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import type { CategoryDto, PaymentMethodDto, SubscriptionDto } from "@/types/dto";
import { CategoryQuickAdd } from "./CategoryQuickAdd";
import { Modal } from "./Modal";
import { PaymentMethodQuickAdd } from "./PaymentMethodQuickAdd";
import { ScheduleEditor } from "./ScheduleEditor";
import { SelectWithQuickAdd } from "./SelectWithQuickAdd";

interface SubscriptionFormModalProps {
  /** Subscription being edited; omitted when adding a new one. */
  initial?: SubscriptionDto;
  categories: CategoryDto[];
  paymentMethods: PaymentMethodDto[];
  onAddCategory: (input: CategoryInput) => Promise<CategoryDto>;
  onAddPaymentMethod: (input: PaymentMethodInput) => Promise<PaymentMethodDto>;
  onSubmit: (input: SubscriptionInput) => Promise<unknown>;
  onClose: () => void;
}

const CURRENCIES = Object.keys(CURRENCY_LABELS) as Currency[];

/**
 * Add/edit form for a subscription. Validates with the same zod schema as the API,
 * then maps any server-side field errors back onto the inputs.
 */
export function SubscriptionFormModal(props: SubscriptionFormModalProps) {
  const { initial, categories, paymentMethods, onAddCategory, onAddPaymentMethod, onSubmit, onClose } = props;
  const [draft, setDraft] = useState<SubscriptionDraft>(() =>
    initial ? draftFromDto(initial) : emptyDraft(todayKey()),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const submission = useAsyncAction(async (input: SubscriptionInput) => {
    await onSubmit(input);
    onClose();
  });

  const set = <K extends keyof SubscriptionDraft>(key: K, value: SubscriptionDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const input = draftToInput(draft);
    const parsed = subscriptionInputSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    await submission.run(input);
  };

  const serverErrors = toFieldErrors(submission.apiError?.details ?? []);
  const fieldError = (path: string) => errors[path] ?? serverErrors[path];
  const showFormError = submission.error && Object.keys(serverErrors).length === 0;

  return (
    <Modal title={initial ? "編輯扣款" : "新增扣款"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="sub-name" className="field-label">
            名稱
          </label>
          <input
            id="sub-name"
            className="field"
            placeholder="例如：Netflix、中華電信月租"
            value={draft.name}
            maxLength={100}
            autoFocus
            onChange={(event) => set("name", event.target.value)}
            aria-invalid={Boolean(fieldError("name"))}
          />
          {fieldError("name") && <p className="field-error">{fieldError("name")}</p>}
        </div>

        <SelectWithQuickAdd
          id="sub-category"
          label="類型"
          placeholder="選擇類型"
          value={draft.categoryId}
          onChange={(value) => set("categoryId", value)}
          options={categories.map((category) => ({
            value: String(category.id),
            label: category.icon ? `${category.icon} ${category.name}` : category.name,
          }))}
          error={fieldError("categoryId")}
          addLabel="新增類型"
          renderAddForm={(done) => <CategoryQuickAdd onCreate={onAddCategory} onDone={done} />}
        />

        <div>
          <span className="field-label" id="sub-amount-label">
            金額
          </span>
          <div className="flex gap-2">
            <div
              role="radiogroup"
              aria-labelledby="sub-amount-label"
              className="flex shrink-0 rounded-[0.875rem] bg-leaf-100/70 p-1"
            >
              {CURRENCIES.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  role="radio"
                  aria-checked={draft.currency === currency}
                  onClick={() => set("currency", currency)}
                  className={`rounded-[0.625rem] px-3 text-sm ${
                    draft.currency === currency ? "bg-white text-leaf-800 shadow-sm" : "text-ink-soft"
                  }`}
                >
                  {CURRENCY_LABELS[currency]}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-num text-sm text-ink-soft">
                {CURRENCY_PREFIX[draft.currency]}
              </span>
              <input
                className="field pl-12 font-num tabular-nums"
                inputMode="decimal"
                placeholder="0"
                aria-label="金額"
                value={draft.amount}
                onChange={(event) => set("amount", event.target.value)}
                aria-invalid={Boolean(fieldError("amount"))}
              />
            </div>
          </div>
          {fieldError("amount") && <p className="field-error">{fieldError("amount")}</p>}
        </div>

        <ScheduleEditor
          schedules={draft.schedules}
          onChange={(schedules) => set("schedules", schedules)}
          errors={{ ...serverErrors, ...errors }}
        />

        <SelectWithQuickAdd
          id="sub-payment"
          label="扣款方式"
          placeholder="選擇信用卡或帳戶"
          value={draft.paymentMethodId}
          onChange={(value) => set("paymentMethodId", value)}
          options={paymentMethods.map((method) => ({
            value: String(method.id),
            label: `${PAYMENT_TYPE_LABELS[method.type]}｜${method.name}`,
          }))}
          error={fieldError("paymentMethodId")}
          addLabel="新增扣款方式"
          renderAddForm={(done) => <PaymentMethodQuickAdd onCreate={onAddPaymentMethod} onDone={done} />}
        />

        <div>
          <label htmlFor="sub-note" className="field-label">
            備註（選填）
          </label>
          <input
            id="sub-note"
            className="field"
            placeholder="例如：家庭方案，和家人分攤"
            value={draft.note}
            maxLength={255}
            onChange={(event) => set("note", event.target.value)}
          />
        </div>

        {showFormError && (
          <p role="alert" className="field-error">
            {submission.error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={submission.pending}>
            {submission.pending ? "儲存中…" : initial ? "儲存變更" : "新增扣款"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
