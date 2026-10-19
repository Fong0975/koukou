"use client";

import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { backupFileName, downloadJson, readJsonFile } from "@/lib/backupFile";
import { readBackupPreview, type BackupPreview } from "@/lib/backupPreview";
import type { BackupCountsDto, BackupDto } from "@/types/dto";

/** A backup file chosen for import, waiting for the user to confirm. */
export interface PendingImport {
  fileName: string;
  preview: BackupPreview;
  /** The parsed file, sent to the server as-is on confirmation. */
  data: unknown;
}

/**
 * Exports all data to a backup file and imports one back, replacing all data. Importing takes two
 * steps: `selectFile` reads the file into `pendingImport`, then `confirmImport` sends it.
 * The actions throw so callers can show why they failed.
 */
export function useBackup() {
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  const exportBackup = useCallback(async () => {
    const backup = await apiRequest<BackupDto>("/api/backup");
    downloadJson(backupFileName(new Date()), backup);
  }, []);

  const selectFile = useCallback(async (file: File) => {
    const data = await readJsonFile(file);
    setPendingImport({ fileName: file.name, preview: readBackupPreview(data), data });
  }, []);

  const confirmImport = useCallback(async () => {
    if (!pendingImport) return;
    await apiRequest<BackupCountsDto>("/api/backup", { method: "PUT", body: pendingImport.data });
  }, [pendingImport]);

  /** Forgets the chosen file, closing its confirmation. */
  const closeImport = useCallback(() => setPendingImport(null), []);

  return { pendingImport, exportBackup, selectFile, confirmImport, closeImport };
}
