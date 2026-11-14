import type { PaymentType } from "@/generated/prisma/enums";
import type { PaymentMethodDto } from "@/types/dto";
import { PAYMENT_TYPE_LABELS } from "../labels";
import { moveId } from "../form/moveId";

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
 * Orders payment methods by type, then by their manual sortOrder, with the id as a final tie-breaker.
 *
 * @param methods - The payment methods.
 * @returns A new, sorted array; the input is left untouched.
 */
export function sortPaymentMethods(methods: PaymentMethodDto[]): PaymentMethodDto[] {
  return [...methods].sort(
    (a, b) => paymentTypeRank(a.type) - paymentTypeRank(b.type) || a.sortOrder - b.sortOrder || a.id - b.id,
  );
}

/** The payment methods of one type, in display order. */
interface PaymentMethodGroup {
  type: PaymentType;
  methods: PaymentMethodDto[];
}

/**
 * Splits payment methods into one group per type, in type order, leaving out types that have none.
 *
 * @param methods - The payment methods in display order.
 */
export function groupPaymentMethodsByType(methods: PaymentMethodDto[]): PaymentMethodGroup[] {
  return PAYMENT_TYPES.map((type) => ({ type, methods: methods.filter((method) => method.type === type) })).filter(
    (group) => group.methods.length > 0,
  );
}

/**
 * Computes the full display order after moving one payment method a step up or down within its own type.
 * Payment methods never cross into another type, so the groups keep their type order.
 *
 * @param methods - The payment methods in display order.
 * @param id - The payment method to move.
 * @param offset - -1 to move it earlier, 1 to move it later.
 * @returns Every payment method id in the new order, or null when the method is unknown or already at that end of its type.
 */
export function movePaymentMethodWithinType(methods: PaymentMethodDto[], id: number, offset: -1 | 1): number[] | null {
  const target = methods.find((method) => method.id === id);
  if (!target) return null;

  const groupIds = (type: PaymentType) => methods.filter((method) => method.type === type).map((method) => method.id);
  const moved = moveId(groupIds(target.type), id, offset);
  if (!moved) return null;

  return PAYMENT_TYPES.flatMap((type) => (type === target.type ? moved : groupIds(type)));
}
