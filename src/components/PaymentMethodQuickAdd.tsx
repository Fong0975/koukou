"use client";

import { useState } from "react";
import type { PaymentType } from "@/generated/prisma/enums";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { PaymentMethodFields } from "./PaymentMethodFields";
import { QuickAddActions, saveOnEnter } from "./QuickAddActions";

interface PaymentMethodQuickAddProps {
  onCreate: (input: PaymentMethodInput) => Promise<PaymentMethodDto>;
  /** Called with the new payment method id after creating, or with nothing on cancel. */
  onDone: (newValue?: string) => void;
}

/** Inline form for adding a payment method: its type plus the card or account name. */
export function PaymentMethodQuickAdd({ onCreate, onDone }: PaymentMethodQuickAddProps) {
  const [type, setType] = useState<PaymentType>("CREDIT_CARD");
  const [name, setName] = useState("");
  const { pending, error, run } = useAsyncAction(onCreate);

  const save = async () => {
    const created = await run({ type, name });
    if (created) onDone(String(created.id));
  };

  return (
    <div>
      <PaymentMethodFields
        type={type}
        name={name}
        onTypeChange={setType}
        onNameChange={setName}
        onKeyDown={saveOnEnter(() => void save())}
      />
      <QuickAddActions pending={pending} error={error} onSave={() => void save()} onCancel={() => onDone()} />
    </div>
  );
}
