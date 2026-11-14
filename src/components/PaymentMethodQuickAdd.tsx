"use client";

import type { PaymentType } from "@/generated/prisma/enums";
import { useLookupForm } from "@/hooks/useLookupForm";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { PaymentMethodFields } from "./PaymentMethodFields";
import { QuickAddActions } from "./QuickAddActions";

interface PaymentMethodQuickAddProps {
  onCreate: (input: PaymentMethodInput) => Promise<PaymentMethodDto>;
  /** Called with the new payment method id after creating, or with nothing on cancel. */
  onDone: (newValue?: string) => void;
}

const EMPTY_VALUES: { type: PaymentType; name: string; note: string } = { type: "CREDIT_CARD", name: "", note: "" };

/**
 * Inline form for adding a payment method: its type, the card or account name and an optional note.
 * Anything typed or a changed type counts as unsaved changes.
 */
export function PaymentMethodQuickAdd({ onCreate, onDone }: PaymentMethodQuickAddProps) {
  const form = useLookupForm(EMPTY_VALUES, onCreate, (created) => onDone(String(created.id)));

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
        onCancel={() => onDone()}
      />
    </div>
  );
}
