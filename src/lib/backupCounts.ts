import type { BackupCountsDto } from "@/types/dto";

/**
 * Counts the records of each kind in a backup.
 *
 * @param backup - The backup's record lists.
 */
export function countBackupRecords(backup: {
  categories: readonly unknown[];
  paymentMethods: readonly unknown[];
  subscriptions: readonly unknown[];
}): BackupCountsDto {
  return {
    categories: backup.categories.length,
    paymentMethods: backup.paymentMethods.length,
    subscriptions: backup.subscriptions.length,
  };
}
