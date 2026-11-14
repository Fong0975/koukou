import { PAYMENT_TYPE_LABELS } from "@/lib/labels";
import type { PaymentMethodDto } from "@/types/dto";

/**
 * Text of a payment method in a select option: "type｜name", followed by the note in
 * parentheses when it has one. Native options cannot be styled, so the note is plain text.
 *
 * @param method - The payment method to label.
 * @returns e.g. "信用卡｜國泰 CUBE（主力卡）".
 */
export function paymentMethodOptionLabel(method: Pick<PaymentMethodDto, "type" | "name" | "note">): string {
  const label = `${PAYMENT_TYPE_LABELS[method.type]}｜${method.name}`;
  return method.note ? `${label}（${method.note}）` : label;
}
