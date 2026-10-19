import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as BackupFile from "@/lib/backupFile";
import { makeBackup } from "@/test/backup";

const { apiRequest, downloadJson } = vi.hoisted(() => ({ apiRequest: vi.fn(), downloadJson: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ apiRequest }));
vi.mock("@/lib/backupFile", async (importOriginal) => ({
  ...(await importOriginal<typeof BackupFile>()),
  downloadJson,
}));

import { useBackup } from "./useBackup";

type Hook = ReturnType<typeof useBackup>;

/** A chosen file; jsdom's File has no text(), so a stand-in provides it. */
const file = (text: string) => ({ name: "koukou-backup-20261019.json", text: () => Promise.resolve(text) }) as File;

const backup = makeBackup();
const preview = {
  appVersion: "v1.0.12",
  exportedAt: "2026-10-19T08:00:00.000Z",
  counts: { categories: 1, paymentMethods: 1, subscriptions: 1 },
};

describe("useBackup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ now: new Date(2026, 9, 19, 9, 0), toFake: ["Date"] });
    apiRequest.mockResolvedValue(backup);
  });
  afterEach(() => vi.useRealTimers());

  const tests: {
    name: string;
    steps: ((hook: Hook) => Promise<unknown> | void)[];
    expectedError?: string;
    expectedPending: unknown;
    expectedRequests: unknown[][];
    expectedDownloads: unknown[][];
  }[] = [
    {
      name: "export fetches the backup and saves it under today's name",
      steps: [(hook) => hook.exportBackup()],
      expectedPending: null,
      expectedRequests: [["/api/backup"]],
      expectedDownloads: [["koukou-backup-20261019.json", backup]],
    },
    {
      name: "choosing a backup file waits for confirmation",
      steps: [(hook) => hook.selectFile(file(JSON.stringify(backup)))],
      expectedPending: { fileName: "koukou-backup-20261019.json", preview, data: backup },
      expectedRequests: [],
      expectedDownloads: [],
    },
    {
      name: "choosing a file that is not JSON fails",
      steps: [(hook) => hook.selectFile(file("not json"))],
      expectedError: "無法讀取這個檔案，請選擇 KouKou 匯出的 JSON 備份檔",
      expectedPending: null,
      expectedRequests: [],
      expectedDownloads: [],
    },
    {
      name: "choosing JSON that is not a backup fails",
      steps: [(hook) => hook.selectFile(file("{}"))],
      expectedError: "這不是 KouKou 的備份檔",
      expectedPending: null,
      expectedRequests: [],
      expectedDownloads: [],
    },
    {
      name: "confirming sends the chosen file",
      steps: [(hook) => hook.selectFile(file(JSON.stringify(backup))), (hook) => hook.confirmImport()],
      expectedPending: { fileName: "koukou-backup-20261019.json", preview, data: backup },
      expectedRequests: [["/api/backup", { method: "PUT", body: backup }]],
      expectedDownloads: [],
    },
    {
      name: "confirming without a chosen file sends nothing",
      steps: [(hook) => hook.confirmImport()],
      expectedPending: null,
      expectedRequests: [],
      expectedDownloads: [],
    },
    {
      name: "closing forgets the chosen file",
      steps: [(hook) => hook.selectFile(file(JSON.stringify(backup))), (hook) => hook.closeImport()],
      expectedPending: null,
      expectedRequests: [],
      expectedDownloads: [],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const { result } = renderHook(() => useBackup());

      let error: unknown;
      for (const step of tt.steps) {
        await act(async () => {
          try {
            await step(result.current);
          } catch (caught) {
            error = caught;
          }
        });
      }

      if (tt.expectedError) expect(error).toEqual(new Error(tt.expectedError));
      else expect(error).toBeUndefined();
      expect(result.current.pendingImport).toEqual(tt.expectedPending);
      expect(apiRequest.mock.calls).toEqual(tt.expectedRequests);
      expect(downloadJson.mock.calls).toEqual(tt.expectedDownloads);
    });
  }
});
