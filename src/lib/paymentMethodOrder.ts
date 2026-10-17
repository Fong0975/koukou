import type { PaymentType } from "@/generated/prisma/enums";
import type { PaymentMethodDto } from "@/types/dto";
import { PAYMENT_TYPE_LABELS } from "./labels";

/** Payment types in display order. */
const PAYMENT_TYPES = Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[];

/**
 * Position of a payment type in display order (credit card, bank account, other).
 *
 * @param type - The payment type.
 */
export function paymentTypeRank(type: PaymentType): number {
  return PAYMENT_TYPES.indexOf(type);
}

/**
 * Orders payment methods by type, then by name, with the id as a final tie-breaker.
 *
 * @param methods - The payment methods.
 * @returns A new, sorted array; the input is left untouched.
 */
export function sortPaymentMethods(methods: PaymentMethodDto[]): PaymentMethodDto[] {
  return [...methods].sort(
    (a, b) => paymentTypeRank(a.type) - paymentTypeRank(b.type) || a.name.localeCompare(b.name) || a.id - b.id,
  );
}
