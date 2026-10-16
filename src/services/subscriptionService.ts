import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import type { SubscriptionData } from "@/lib/validation/subscriptionSchema";
import type { SubscriptionDto } from "@/types/dto";
import { rethrowPrismaError, type PrismaErrorMessages } from "./prismaErrors";
import { subscriptionInclude, toSubscriptionDto } from "./subscriptionMapper";

const notFoundMessage = (id: number) => `找不到扣款項目 #${id}`;

const writeErrorMessages = (id?: number): PrismaErrorMessages => ({
  notFound: id === undefined ? undefined : notFoundMessage(id),
  foreignKey: "選擇的類型或扣款方式不存在",
});

/** Maps validated input to the scalar columns of a subscription. */
function toSubscriptionColumns(data: SubscriptionData) {
  return {
    name: data.name,
    categoryId: data.categoryId,
    paymentMethodId: data.paymentMethodId,
    currency: data.currency,
    amount: data.amount.toFixed(2),
    note: data.note,
  };
}

/**
 * Lists all subscriptions, newest first.
 *
 * @returns Every subscription with category, payment method and schedules.
 */
export async function listSubscriptions(): Promise<SubscriptionDto[]> {
  const records = await prisma.subscription.findMany({
    include: subscriptionInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return records.map(toSubscriptionDto);
}

/**
 * Fetches one subscription.
 *
 * @param id - Subscription id.
 * @returns The subscription.
 * @throws NotFoundError when it does not exist.
 */
export async function getSubscription(id: number): Promise<SubscriptionDto> {
  const record = await prisma.subscription.findUnique({ where: { id }, include: subscriptionInclude });
  if (!record) throw new NotFoundError(notFoundMessage(id));
  return toSubscriptionDto(record);
}

/**
 * Creates a subscription together with its billing schedules.
 *
 * @param data - Validated subscription data.
 * @returns The created subscription.
 * @throws ValidationError when the category or payment method does not exist.
 */
export async function createSubscription(data: SubscriptionData): Promise<SubscriptionDto> {
  try {
    const record = await prisma.subscription.create({
      data: { ...toSubscriptionColumns(data), schedules: { create: data.schedules } },
      include: subscriptionInclude,
    });
    return toSubscriptionDto(record);
  } catch (error) {
    rethrowPrismaError(error, writeErrorMessages());
  }
}

/**
 * Replaces a subscription's fields and its whole schedule list. The nested
 * deleteMany + create runs in one statement batch, so it is atomic.
 *
 * @param id - Subscription id.
 * @param data - Validated subscription data.
 * @returns The updated subscription.
 * @throws NotFoundError when it does not exist.
 * @throws ValidationError when the category or payment method does not exist.
 */
export async function updateSubscription(id: number, data: SubscriptionData): Promise<SubscriptionDto> {
  try {
    const record = await prisma.subscription.update({
      where: { id },
      data: { ...toSubscriptionColumns(data), schedules: { deleteMany: {}, create: data.schedules } },
      include: subscriptionInclude,
    });
    return toSubscriptionDto(record);
  } catch (error) {
    rethrowPrismaError(error, writeErrorMessages(id));
  }
}

/**
 * Deletes a subscription; its schedules are removed by the cascade rule.
 *
 * @param id - Subscription id.
 * @throws NotFoundError when it does not exist.
 */
export async function deleteSubscription(id: number): Promise<void> {
  try {
    await prisma.subscription.delete({ where: { id } });
  } catch (error) {
    rethrowPrismaError(error, { notFound: notFoundMessage(id) });
  }
}
