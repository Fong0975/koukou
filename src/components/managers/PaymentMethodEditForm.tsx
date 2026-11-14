"use client";

import { useLookupForm } from "@/hooks/useLookupForm";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { PaymentMethodFields } from "./PaymentMethodFields";
import { QuickAddActions } from "./QuickAddActions";

interface PaymentMethodEditFormProps {
  paymentMethod: PaymentMethodDto;
  onSave: (id: number, input: PaymentMethodInput) => Promise<PaymentMethodDto>;
  /** Called after a successful save or when the edit is cancelled. */
  onDone: () => void;
}

/**
 * Inline form for changing a payment method's type, name and note; stays open and shows the
 * reason if saving fails. The note is part of the form so saving never clears it by accident.
 * Values that differ from the payment method's count as unsaved changes.
 */
export function PaymentMethodEditForm({ paymentMethod, onSave, onDone }: PaymentMethodEditFormProps) {
  const form = useLookupForm(
    { type: paymentMethod.type, name: paymentMethod.name, note: paymentMethod.note ?? "" },
    (values) => onSave(paymentMethod.id, values),
    onDone,
  );

  return (
    <div>
      <PaymentMethodFields
        type={form.values.type}
        name={form.values.name}
        note={form.values.note}
        onTypeChange={form.setField("type")}
        onNameChange={form.setField("name")}
        onNoteChange={form.setField("note")}
        onKeyDown={form.onKeyDown}
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
