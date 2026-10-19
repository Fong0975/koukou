import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import type { PaymentMethodData } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { rethrowPrismaError } from "./prismaErrors";

const logger = createLogger("paymentMethodService");

/** Columns of a payment method returned by the API and written to backups. */
export const paymentMethodSelect = { id: true, type: true, name: true, note: true } as const;

/**
 * Lists all payment methods grouped by type.
 *
 * @returns Payment methods sorted by type, then name.
 */
export async function listPaymentMethods(): Promise<PaymentMethodDto[]> {
  const paymentMethods = await prisma.paymentMethod.findMany({
    select: paymentMethodSelect,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  logger.debug("Payment methods listed", { count: paymentMethods.length });
  return paymentMethods;
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
    const paymentMethod = await prisma.paymentMethod.create({ data, select: paymentMethodSelect });
    logger.info("Payment method created", {
      id: paymentMethod.id,
      type: paymentMethod.type,
      name: paymentMethod.name,
    });
    return paymentMethod;
  } catch (error) {
    rethrowPrismaError(error, { conflict: `扣款方式「${data.name}」已存在` });
  }
}
