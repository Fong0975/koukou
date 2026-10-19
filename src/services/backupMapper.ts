import { utcDateToDateKey } from "@/lib/dateKey";
import type { BackupData } from "@/lib/validation/backupSchema";
import type { BackupSubscriptionDto } from "@/types/dto";
import { toAmountPeriodRows, toSubscriptionColumns } from "./subscriptionColumns";
import {
  serializeSubscriptionColumns,
  toAmountString,
  type SubscriptionColumnsRecord,
  type SubscriptionRecord,
} from "./subscriptionMapper";

/** Structural shape of a subscription row loaded with {@link backupSubscriptionSelect}. */
export interface BackupSubscriptionRecord extends SubscriptionColumnsRecord {
  categoryId: number;
  paymentMethodId: number;
  schedules: Omit<SubscriptionRecord["schedules"][number], "id">[];
  amountPeriods: Omit<SubscriptionRecord["amountPeriods"][number], "id">[];
}

/** Prisma `select` that loads everything {@link toBackupSubscriptionDto} needs. */
export const backupSubscriptionSelect = {
  id: true,
  name: true,
  categoryId: true,
  paymentMethodId: true,
  currency: true,
  amount: true,
  amortize: true,
  startDate: true,
  contractEndDate: true,
  note: true,
  createdAt: true,
  schedules: {
    select: { cycle: true, dayOfWeek: true, dayOfMonth: true, month: true },
    orderBy: { id: "asc" },
  },
  amountPeriods: {
    select: { amount: true, endDate: true },
    orderBy: { endDate: "asc" },
  },
} as const;

/**
 * Converts a DB record into its backup entry.
 *
 * @param record - Subscription loaded with {@link backupSubscriptionSelect}.
 */
export function toBackupSubscriptionDto(record: BackupSubscriptionRecord): BackupSubscriptionDto {
  return {
    ...serializeSubscriptionColumns(record),
    categoryId: record.categoryId,
    paymentMethodId: record.paymentMethodId,
    schedules: record.schedules,
    amountPeriods: record.amountPeriods.map((period) => ({
      amount: toAmountString(period.amount),
      endDate: utcDateToDateKey(period.endDate),
    })),
  };
}

/**
 * Maps a validated backup to the rows written to each table on import. Categories, payment
 * methods and subscriptions keep their ids so the references between them stay intact.
 *
 * @param data - The validated backup.
 */
export function toImportRows(data: BackupData) {
  return {
    categories: data.categories,
    paymentMethods: data.paymentMethods,
    subscriptions: data.subscriptions.map((subscription) => ({
      id: subscription.id,
      createdAt: new Date(subscription.createdAt),
      ...toSubscriptionColumns(subscription),
    })),
    schedules: data.subscriptions.flatMap((subscription) =>
      subscription.schedules.map((schedule) => ({ subscriptionId: subscription.id, ...schedule })),
    ),
    amountPeriods: data.subscriptions.flatMap((subscription) =>
      toAmountPeriodRows(subscription).map((row) => ({ subscriptionId: subscription.id, ...row })),
    ),
  };
}
