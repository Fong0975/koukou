import { prisma } from "@/lib/db";
import type { PaymentMethodData } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { rethrowPrismaError } from "./prismaErrors";

const paymentMethodSelect = { id: true, type: true, name: true, note: true } as const;

/**
 * Lists all payment methods grouped by type.
 *
 * @returns Payment methods sorted by type, then name.
 */
export async function listPaymentMethods(): Promise<PaymentMethodDto[]> {
  return prisma.paymentMethod.findMany({
    select: paymentMethodSelect,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

/**
 * Creates a payment method.
 *
 * @param data - Validated payment method data.
 * @returns The created payment method.
 * @throws ConflictError when the same type + name already exists.
 */
export async function createPaymentMethod(data: PaymentMethodData): Promise<PaymentMethodDto> {
  try {
    return await prisma.paymentMethod.create({ data, select: paymentMethodSelect });
  } catch (error) {
    rethrowPrismaError(error, { conflict: `扣款方式「${data.name}」已存在` });
  }
}
