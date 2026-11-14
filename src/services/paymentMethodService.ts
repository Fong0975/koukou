import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import type { PaymentMethodData } from "@/lib/validation/paymentMethodSchema";
import type { PaymentMethodDto } from "@/types/dto";
import { createInOrder, saveDisplayOrder, type SetSortOrder } from "./lookupTable";
import { rethrowPrismaError } from "./prismaErrors";

const logger = createLogger("paymentMethodService");

/** Columns of a payment method returned by the API and written to backups. */
export const paymentMethodSelect = { id: true, type: true, name: true, note: true, sortOrder: true } as const;

const setSortOrder: SetSortOrder = (tx, id, sortOrder) =>
  tx.paymentMethod.update({ where: { id }, data: { sortOrder } });

const notFound = "找不到這個扣款方式";
const conflict = (name: string) => `扣款方式「${name}」已存在`;

/**
 * Lists all payment methods grouped by type.
 *
 * @returns Payment methods sorted by type, then sortOrder, then id.
 */
export async function listPaymentMethods(): Promise<PaymentMethodDto[]> {
  const paymentMethods = await prisma.paymentMethod.findMany({
    select: paymentMethodSelect,
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });
  logger.debug("Payment methods listed", { count: paymentMethods.length });
  return paymentMethods;
}

/**
 * Creates a payment method at the end of the ones of the same type.
 *
 * @param data - Validated payment method data.
 * @returns The created payment method.
 * @throws ConflictError when the same type + name already exists.
 */
export async function createPaymentMethod(data: PaymentMethodData): Promise<PaymentMethodDto> {
  try {
    const paymentMethod = await createInOrder({
      siblings: (tx) =>
        tx.paymentMethod.findMany({
          where: { type: data.type },
          select: { id: true, sortOrder: true },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        }),
      create: (tx, sortOrder) => tx.paymentMethod.create({ data: { ...data, sortOrder }, select: paymentMethodSelect }),
      setSortOrder,
    });
    logger.info("Payment method created", {
      id: paymentMethod.id,
      type: paymentMethod.type,
      name: paymentMethod.name,
    });
    return paymentMethod;
  } catch (error) {
    rethrowPrismaError(error, { conflict: conflict(data.name) });
  }
}

/**
 * Changes a payment method's type, name or note.
 *
 * @param id - Payment method id.
 * @param data - Validated payment method data.
 * @returns The updated payment method.
 * @throws NotFoundError when it does not exist; ConflictError when the same type + name is taken.
 */
export async function updatePaymentMethod(id: number, data: PaymentMethodData): Promise<PaymentMethodDto> {
  try {
    const paymentMethod = await prisma.paymentMethod.update({ where: { id }, data, select: paymentMethodSelect });
    logger.info("Payment method updated", { id, type: paymentMethod.type, name: paymentMethod.name });
    return paymentMethod;
  } catch (error) {
    rethrowPrismaError(error, { notFound, conflict: conflict(data.name) });
  }
}

/**
 * Saves a new display order by renumbering every payment method's sortOrder in steps of 10.
 * Grouping by type is the caller's concern; the list is only ordered within each type when displayed.
 *
 * @param ids - Every existing payment method id, in the desired order.
 * @returns The payment methods in their new order.
 * @throws ValidationError when ids is not exactly the set of existing payment method ids.
 */
export async function reorderPaymentMethods(ids: number[]): Promise<PaymentMethodDto[]> {
  await saveDisplayOrder(
    ids,
    { listIds: (tx) => tx.paymentMethod.findMany({ select: { id: true } }), setSortOrder },
    "扣款方式排序與目前的扣款方式不一致，請重新整理後再試",
  );
  logger.info("Payment methods reordered", { count: ids.length });
  return listPaymentMethods();
}

/**
 * Deletes a payment method that no subscription uses.
 *
 * @param id - Payment method id.
 * @throws NotFoundError when it does not exist; ValidationError when a subscription still uses it.
 */
export async function deletePaymentMethod(id: number): Promise<void> {
  try {
    await prisma.paymentMethod.delete({ where: { id } });
    logger.info("Payment method deleted", { id });
  } catch (error) {
    rethrowPrismaError(error, { notFound, foreignKey: "仍有扣款項目使用這個扣款方式，無法刪除" });
  }
}
