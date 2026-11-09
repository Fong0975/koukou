import type { KeyboardEventHandler } from "react";
import type { PaymentType } from "@/generated/prisma/enums";
import { PAYMENT_TYPE_LABELS } from "@/lib/labels";

const PAYMENT_TYPES = Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[];

interface PaymentMethodFieldsProps {
  type: PaymentType;
  name: string;
  onTypeChange: (type: PaymentType) => void;
  onNameChange: (name: string) => void;
  onKeyDown: KeyboardEventHandler;
}

/** The type select and card or account name input shared by the payment method add and edit forms. */
export function PaymentMethodFields({ type, name, onTypeChange, onNameChange, onKeyDown }: PaymentMethodFieldsProps) {
  return (
    <div className="flex gap-2">
      <select
        className="field w-auto shrink-0"
        aria-label="扣款方式種類"
        value={type}
        onChange={(event) => onTypeChange(event.target.value as PaymentType)}
      >
        {PAYMENT_TYPES.map((paymentType) => (
          <option key={paymentType} value={paymentType}>
            {PAYMENT_TYPE_LABELS[paymentType]}
          </option>
        ))}
      </select>
      <input
        className="field min-w-0"
        placeholder={type === "BANK_ACCOUNT" ? "帳戶名稱，例如：台新 Richart" : "卡片名稱，例如：國泰 CUBE"}
        aria-label="卡片或帳戶名稱"
        value={name}
        maxLength={100}
        autoFocus
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
