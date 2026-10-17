import { dateKeyToUtcDate } from "@/lib/dateKey";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import type { SubscriptionData } from "@/lib/validation/subscriptionSchema";
import type { SubscriptionDto } from "@/types/dto";
import { rethrowPrismaError, type PrismaErrorMessages } from "./prismaErrors";
import { subscriptionInclude, toSubscriptionDto } from "./subscriptionMapper";

const logger = createLogger("subscriptionService");

const notFoundMessage = (id: number) => `找不到扣款項目 #${id}`;

const writeErrorMessages = (id?: number): PrismaErrorMessages => ({
  notFound: id === undefined ? undefined : notFoundMessage(id),
  foreignKey: "選擇的類型或扣款方式不存在",
});

/** Formats a validated amount for a DECIMAL(12, 2) column. */
const toDecimalColumn = (amount: number) => amount.toFixed(2);

/** Maps validated input to the scalar columns of a subscription. */
function toSubscriptionColumns(data: SubscriptionData) {
  return {
    name: data.name,
    categoryId: data.categoryId,
    paymentMethodId: data.paymentMethodId,
    currency: data.currency,
    amount: toDecimalColumn(data.amount),
    amortize: data.amortize,
    startDate: dateKeyToUtcDate(data.startDate),
    note: data.note,
  };
}

/** Maps validated past amounts to rows of the amount period table. */
function toAmountPeriodRows(data: SubscriptionData) {
  return data.amountPeriods.map((period) => ({
    amount: toDecimalColumn(period.amount),
    endDate: dateKeyToUtcDate(period.endDate),
  }));
}

/** Child row counts included in write log entries. */
const childCounts = (data: SubscriptionData) => ({
  schedules: data.schedules.length,
  amountPeriods: data.amountPeriods.length,
});

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
  logger.debug("Subscriptions listed", { count: records.length });
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
 * Creates a subscription together with its billing schedules and past amounts.
 *
 * @param data - Validated subscription data.
 * @returns The created subscription.
 * @throws ValidationError when the category or payment method does not exist.
 */
export async function createSubscription(data: SubscriptionData): Promise<SubscriptionDto> {
  try {
    const record = await prisma.subscription.create({
      data: {
        ...toSubscriptionColumns(data),
        schedules: { create: data.schedules },
        amountPeriods: { create: toAmountPeriodRows(data) },
      },
      include: subscriptionInclude,
    });
    logger.info("Subscription created", { id: record.id, ...childCounts(data) });
    return toSubscriptionDto(record);
  } catch (error) {
    rethrowPrismaError(error, writeErrorMessages());
  }
}

/**
 * Replaces a subscription's fields, its whole schedule list and all past amounts. The
 * nested deleteMany + create runs in one statement batch, so it is atomic.
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
      data: {
        ...toSubscriptionColumns(data),
        schedules: { deleteMany: {}, create: data.schedules },
        amountPeriods: { deleteMany: {}, create: toAmountPeriodRows(data) },
      },
      include: subscriptionInclude,
    });
    logger.info("Subscription updated", { id, ...childCounts(data) });
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
    logger.info("Subscription deleted", { id });
  } catch (error) {
    rethrowPrismaError(error, { notFound: notFoundMessage(id) });
  }
}
