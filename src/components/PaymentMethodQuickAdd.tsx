"use client";

import { useState } from "react";
import type { PaymentType } from "@/generated/prisma/enums";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { PAYMENT_TYPE_LABELS } from "@/lib/labels";
import type { PaymentMethodInput } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { QuickAddActions, saveOnEnter } from "./QuickAddActions";

interface PaymentMethodQuickAddProps {
  onCreate: (input: PaymentMethodInput) => Promise<PaymentMethodDto>;
  /** Called with the new payment method id after creating, or with nothing on cancel. */
  onDone: (newValue?: string) => void;
}

const PAYMENT_TYPES = Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[];

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
      <div className="flex gap-2">
        <select
          className="field w-auto"
          aria-label="扣款方式種類"
          value={type}
          onChange={(event) => setType(event.target.value as PaymentType)}
        >
          {PAYMENT_TYPES.map((paymentType) => (
            <option key={paymentType} value={paymentType}>
              {PAYMENT_TYPE_LABELS[paymentType]}
            </option>
          ))}
        </select>
        <input
          className="field"
          placeholder={type === "BANK_ACCOUNT" ? "帳戶名稱，例如：台新 Richart" : "卡片名稱，例如：國泰 CUBE"}
          aria-label="卡片或帳戶名稱"
          value={name}
          maxLength={100}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={saveOnEnter(() => void save())}
        />
      </div>
      <QuickAddActions pending={pending} error={error} onSave={() => void save()} onCancel={() => onDone()} />
    </div>
  );
}
