import type { BackupCountsDto } from "@/types/dto";
import { countBackupRecords } from "./backupCounts";
import { BACKUP_FORMAT } from "./constants/backupFormat";

/** What a backup file holds, shown before it replaces the current data. */
export interface BackupPreview {
  /** Version label of the app that wrote it, or null when missing. */
  appVersion: string | null;
  /** When it was written, as an ISO timestamp, or null when missing. */
  exportedAt: string | null;
  counts: BackupCountsDto;
}

const optionalString = (value: unknown) => (typeof value === "string" ? value : null);

/**
 * Summarizes a parsed backup file for the import confirmation. Only the outline is checked
 * here; the server validates every record on import.
 *
 * @param value - The parsed file.
 * @throws Error with a user-facing message when the value is not a KouKou backup.
 */
export function readBackupPreview(value: unknown): BackupPreview {
  if (typeof value !== "object" || value === null || !("format" in value) || value.format !== BACKUP_FORMAT) {
    throw new Error("這不是 KouKou 的備份檔");
  }
  const { categories, paymentMethods, subscriptions } = value as Record<string, unknown>;
  if (!Array.isArray(categories) || !Array.isArray(paymentMethods) || !Array.isArray(subscriptions)) {
    throw new Error("備份檔內容不完整");
  }
  const { appVersion, exportedAt } = value as Record<string, unknown>;
  return {
    appVersion: optionalString(appVersion),
    exportedAt: optionalString(exportedAt),
    counts: countBackupRecords({ categories, paymentMethods, subscriptions }),
  };
}
