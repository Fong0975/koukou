"use client";

import { useState, type FormEvent } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { todayKey } from "@/lib/dateKey";
import { toFieldErrors, type FieldErrors } from "@/lib/fieldErrors";
import {
  draftFromDto,
  draftToInput,
  emptyDraft,
  isDraftChanged,
  type SubscriptionDraft,
} from "@/lib/subscriptionDraft";
import type { CategoryInput } from "@/lib/validation/categorySchema";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import { subscriptionInputSchema, type SubscriptionInput } from "@/lib/validation/subscriptionSchema";
import type { CategoryDto, PaymentMethodDto, SubscriptionDto } from "@/types/dto";
import { FormSection } from "./FormSection";
import { GuardedModal } from "./GuardedModal";
import { REMINDERS_LABEL, ReminderSection } from "./ReminderSection";
import { SubscriptionBasicsSection } from "./SubscriptionBasicsSection";
import { SubscriptionBillingSection } from "./SubscriptionBillingSection";
import { SubscriptionPeriodSection } from "./SubscriptionPeriodSection";

interface SubscriptionFormModalProps {
  /** Subscription being edited; omitted when adding a new one. */
  initial?: SubscriptionDto;
  categories: CategoryDto[];
  paymentMethods: PaymentMethodDto[];
  onAddCategory: (input: CategoryInput) => Promise<CategoryDto>;
  onAddPaymentMethod: (input: PaymentMethodInput) => Promise<PaymentMethodDto>;
  onSubmit: (input: SubscriptionInput) => Promise<unknown>;
  onClose: () => void;
  /** Whether LINE reminders go out; the reminder block is locked otherwise. */
  remindersActive: boolean;
}

/**
 * Add/edit form for a subscription, grouped into basics, amount and charging, subscription period and
 * LINE reminders. Validates with the same zod schema as the API,
 * then maps any server-side field errors back onto the inputs. Closing it with unsaved changes,
 * in the form or in a quick-add form inside it, asks first; 取消 closes it right away.
 */
export function SubscriptionFormModal(props: SubscriptionFormModalProps) {
  const { initial, categories, paymentMethods, onAddCategory, onAddPaymentMethod, onSubmit, onClose, remindersActive } =
    props;
  const [initialDraft] = useState<SubscriptionDraft>(() => (initial ? draftFromDto(initial) : emptyDraft(todayKey())));
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const submission = useAsyncAction(async (input: SubscriptionInput) => {
    await onSubmit(input);
    onClose();
  });

  const patch = (values: Partial<SubscriptionDraft>) => setDraft((prev) => ({ ...prev, ...values }));

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
  const fieldErrors: FieldErrors = { ...serverErrors, ...errors };
  const showFormError = submission.error && Object.keys(serverErrors).length === 0;

  return (
    <GuardedModal
      title={initial ? "編輯扣款" : "新增扣款"}
      dirty={isDraftChanged(initialDraft, draft)}
      onClose={onClose}
      titleClassName="font-semibold"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <SubscriptionBasicsSection
          name={draft.name}
          categoryId={draft.categoryId}
          note={draft.note}
          categories={categories}
          onAddCategory={onAddCategory}
          onChange={patch}
          errors={fieldErrors}
        />

        <SubscriptionBillingSection
          currency={draft.currency}
          amount={draft.amount}
          amountPeriods={draft.amountPeriods}
          schedules={draft.schedules}
          amortize={draft.amortize}
          paymentMethodId={draft.paymentMethodId}
          startDate={draft.startDate}
          paymentMethods={paymentMethods}
          onAddPaymentMethod={onAddPaymentMethod}
          onChange={patch}
          errors={fieldErrors}
        />

        <SubscriptionPeriodSection
          startDate={draft.startDate}
          contractEndDate={draft.contractEndDate}
          pauses={draft.pauses}
          onChange={patch}
          errors={fieldErrors}
        />

        <FormSection title={REMINDERS_LABEL}>
          <ReminderSection
            reminders={draft.reminders}
            hasContractEnd={draft.contractEndDate !== ""}
            disabled={!remindersActive}
            onChange={(reminders) => patch({ reminders })}
            errors={fieldErrors}
          />
        </FormSection>

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
    </GuardedModal>
  );
}
