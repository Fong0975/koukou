import { APP_VERSION_LABEL } from "@/lib/appVersion";
import { countBackupRecords } from "@/lib/backupCounts";
import { BACKUP_FORMAT, BACKUP_VERSION } from "@/lib/constants/backupFormat";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import type { BackupData } from "@/lib/validation/backupSchema";
import type { BackupCountsDto, BackupDto } from "@/types/dto";
import { backupSubscriptionSelect, toBackupSubscriptionDto, toImportRows } from "./backupMapper";
import { categorySelect, paymentMethodSelect } from "./lookupSelects";
import { notificationSettingUpsert, readNotificationSetting } from "./notificationSettingService";
import { rethrowPrismaError } from "./prismaErrors";

const logger = createLogger("backupService");

/**
 * Reads every category, payment method and subscription, and the notification settings, into a backup.
 *
 * @returns The backup, ready to be saved as a JSON file.
 */
export async function exportBackup(): Promise<BackupDto> {
  const [categories, paymentMethods, subscriptions, notificationSetting] = await Promise.all([
    prisma.category.findMany({ select: categorySelect, orderBy: { id: "asc" } }),
    prisma.paymentMethod.findMany({ select: paymentMethodSelect, orderBy: { id: "asc" } }),
    prisma.subscription.findMany({ select: backupSubscriptionSelect, orderBy: { id: "asc" } }),
    readNotificationSetting(),
  ]);
  const backup: BackupDto = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    appVersion: APP_VERSION_LABEL,
    exportedAt: new Date().toISOString(),
    categories,
    paymentMethods,
    subscriptions: subscriptions.map(toBackupSubscriptionDto),
    notificationSetting,
  };
  logger.info("Backup exported", { ...countBackupRecords(backup) });
  return backup;
}

/**
 * Replaces all categories, payment methods and subscriptions with those of a backup, and the
 * notification settings when the backup has them (older backups do not, and keep the current ones).
 * Everything runs in one transaction, so a failure leaves the current data untouched. Stored exchange
 * rates are a cache of public data and the dispatch log is a record of sent messages, so neither is
 * backed up nor cleared.
 *
 * @param data - The validated backup.
 * @returns How many records of each kind were restored.
 * @throws ConflictError when the database rejects a name as a duplicate, e.g. names differing only in case.
 */
export async function importBackup(data: BackupData): Promise<BackupCountsDto> {
  const rows = toImportRows(data);
  try {
    // Subscriptions go first: their schedules, past amounts, pauses and reminders cascade with them, and categories
    // and payment methods cannot be deleted while still referenced.
    await prisma.$transaction([
      prisma.subscription.deleteMany(),
      prisma.category.deleteMany(),
      prisma.paymentMethod.deleteMany(),
      prisma.category.createMany({ data: rows.categories }),
      prisma.paymentMethod.createMany({ data: rows.paymentMethods }),
      prisma.subscription.createMany({ data: rows.subscriptions }),
      prisma.billingSchedule.createMany({ data: rows.schedules }),
      prisma.subscriptionAmountPeriod.createMany({ data: rows.amountPeriods }),
      prisma.subscriptionPause.createMany({ data: rows.pauses }),
      prisma.subscriptionReminder.createMany({ data: rows.reminders }),
      ...(rows.notificationSetting
        ? [prisma.notificationSetting.upsert(notificationSettingUpsert(rows.notificationSetting))]
        : []),
    ]);
  } catch (error) {
    rethrowPrismaError(error, {
      conflict: "備份檔中有重複的類型或扣款方式名稱",
      foreignKey: "備份檔中的扣款項目參照了不存在的類型或扣款方式",
    });
  }
  const counts = countBackupRecords(data);
  logger.info("Backup imported", { ...counts });
  return counts;
}
