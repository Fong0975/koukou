import { paymentTypeRank } from "@/lib/lookups/paymentMethodOrder";
import type { BackupData } from "@/lib/validation/backupSchema";
import type { BackupSubscriptionDto } from "@/types/dto";
import { sortOrderAt } from "./sortOrder";
import { toAmountPeriodRows, toPauseRows, toReminderRows, toSubscriptionColumns } from "./subscriptionColumns";
import {
  childRowQueries,
  serializeAmountPeriod,
  serializePause,
  serializeSubscriptionColumns,
  toRemindersDto,
  type AmountPeriodRecord,
  type PauseRecord,
  type SubscriptionColumnsRecord,
  type SubscriptionRecord,
} from "./subscriptionMapper";

/** Structural shape of a subscription row loaded with {@link backupSubscriptionSelect}. */
export interface BackupSubscriptionRecord extends SubscriptionColumnsRecord {
  categoryId: number;
  paymentMethodId: number;
  schedules: Omit<SubscriptionRecord["schedules"][number], "id">[];
  amountPeriods: AmountPeriodRecord[];
  pauses: PauseRecord[];
  reminders: SubscriptionRecord["reminders"];
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
  ...childRowQueries,
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
    amountPeriods: record.amountPeriods.map(serializeAmountPeriod),
    pauses: record.pauses.map(serializePause),
    reminders: toRemindersDto(record.reminders),
  };
}

/** Compares names by UTF-16 code units so the result does not depend on the runtime's locale. */
function compareNames(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Gives every backed-up payment method a sortOrder. Backups written before payment methods could be
 * reordered lack it, so those get the order they used to be shown in: by type, then name.
 *
 * @param methods - The payment methods of a validated backup.
 */
function withPaymentMethodSortOrder(methods: BackupData["paymentMethods"]) {
  const legacyOrder = [...methods].sort(
    (a, b) => paymentTypeRank(a.type) - paymentTypeRank(b.type) || compareNames(a.name, b.name) || a.id - b.id,
  );
  const legacyPositions = new Map(legacyOrder.map((method, index) => [method.id, sortOrderAt(index)]));
  return methods.map((method) => ({ ...method, sortOrder: method.sortOrder ?? legacyPositions.get(method.id) ?? 0 }));
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
    paymentMethods: withPaymentMethodSortOrder(data.paymentMethods),
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
    pauses: data.subscriptions.flatMap((subscription) =>
      toPauseRows(subscription).map((row) => ({ subscriptionId: subscription.id, ...row })),
    ),
    reminders: data.subscriptions.flatMap((subscription) =>
      toReminderRows(subscription).map((row) => ({ subscriptionId: subscription.id, ...row })),
    ),
    notificationSetting: data.notificationSetting ?? null,
  };
}
