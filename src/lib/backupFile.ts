import { toCalendarDate } from "./calendarMonth";
import { toDateKey } from "./dateKey";

/**
 * Names a backup file after the local day it is written, e.g. "koukou-backup-20261019.json".
 *
 * @param date - When the backup is written.
 */
export function backupFileName(date: Date): string {
  return `koukou-backup-${toDateKey(toCalendarDate(date)).replaceAll("-", "")}.json`;
}

/**
 * Lets the browser save a value as a pretty-printed JSON file.
 *
 * @param fileName - Name suggested for the saved file.
 * @param data - The value to save.
 */
export function downloadJson(fileName: string, data: unknown): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads a file chosen by the user as JSON.
 *
 * @param file - The chosen file.
 * @returns The parsed value.
 * @throws Error with a user-facing message when the file is not valid JSON.
 */
export async function readJsonFile(file: Pick<Blob, "text">): Promise<unknown> {
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new Error("無法讀取這個檔案，請選擇 KouKou 匯出的 JSON 備份檔");
  }
}
