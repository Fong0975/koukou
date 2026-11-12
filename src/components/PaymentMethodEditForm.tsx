"use client";

import { useState } from "react";
import type { PaymentType } from "@/generated/prisma/enums";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useReportUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { PaymentMethodFields } from "./PaymentMethodFields";
import { QuickAddActions, saveOnEnter } from "./QuickAddActions";

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
  const [type, setType] = useState<PaymentType>(paymentMethod.type);
  const [name, setName] = useState(paymentMethod.name);
  const [note, setNote] = useState(paymentMethod.note ?? "");
  useReportUnsavedChanges(
    type !== paymentMethod.type || name !== paymentMethod.name || note !== (paymentMethod.note ?? ""),
  );
  const { pending, error, run } = useAsyncAction(onSave);

  const save = async () => {
    const saved = await run(paymentMethod.id, { type, name, note });
    if (saved) onDone();
  };
  const onKeyDown = saveOnEnter(() => void save());

  return (
    <div>
      <PaymentMethodFields
        type={type}
        name={name}
        onTypeChange={setType}
        onNameChange={setName}
        onKeyDown={onKeyDown}
      />
      <input
        className="field mt-2"
        placeholder="備註（可留空）"
        aria-label="備註（可留空）"
        value={note}
        maxLength={255}
        onChange={(event) => setNote(event.target.value)}
        onKeyDown={onKeyDown}
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
