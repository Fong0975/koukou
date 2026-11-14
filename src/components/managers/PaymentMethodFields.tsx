import type { KeyboardEventHandler } from "react";
import type { PaymentType } from "@/generated/prisma/enums";
import { PAYMENT_TYPE_LABELS } from "@/lib/labels";

const PAYMENT_TYPES = Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[];

interface PaymentMethodFieldsProps {
  type: PaymentType;
  name: string;
  note: string;
  onTypeChange: (type: PaymentType) => void;
  onNameChange: (name: string) => void;
  onNoteChange: (note: string) => void;
  onKeyDown: KeyboardEventHandler;
}

/** The type select, card or account name and note inputs shared by the payment method add and edit forms. */
export function PaymentMethodFields({
  type,
  name,
  note,
  onTypeChange,
  onNameChange,
  onNoteChange,
  onKeyDown,
}: PaymentMethodFieldsProps) {
  return (
    <>
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
      <input
        className="field mt-2"
        placeholder="備註（可留空）"
        aria-label="備註（可留空）"
        value={note}
        maxLength={255}
        onChange={(event) => onNoteChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </>
  );
}
