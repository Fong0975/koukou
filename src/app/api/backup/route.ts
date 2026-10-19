import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { readJson } from "@/lib/http/request";
import { backupSchema } from "@/lib/validation/backupSchema";
import { exportBackup, importBackup } from "@/services/backupService";

/** GET /api/backup — returns every stored record as a backup. */
export const GET = withErrorHandling(async () => jsonData(await exportBackup()));

/** PUT /api/backup — replaces all stored records with those of a backup. */
export const PUT = withErrorHandling(async (request) => {
  const data = backupSchema.parse(await readJson(request));
  return jsonData(await importBackup(data));
});
