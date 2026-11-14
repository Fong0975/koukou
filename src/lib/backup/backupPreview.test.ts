import { describe, expect, it } from "vitest";
import { makeBackup } from "@/test/backup";
import { readBackupPreview } from "./backupPreview";

describe("readBackupPreview", () => {
  const tests: { name: string; value: unknown; expected?: unknown; error?: string }[] = [
    {
      name: "summarizes a backup",
      value: makeBackup(),
      expected: {
        appVersion: "v1.0.12",
        exportedAt: "2026-10-19T08:00:00.000Z",
        counts: { categories: 1, paymentMethods: 1, subscriptions: 1 },
      },
    },
    {
      name: "leaves missing metadata as null",
      value: { ...makeBackup(), appVersion: undefined, exportedAt: 42 },
      expected: { appVersion: null, exportedAt: null, counts: { categories: 1, paymentMethods: 1, subscriptions: 1 } },
    },
    { name: "rejects a non-object", value: [1, 2], error: "這不是 KouKou 的備份檔" },
    { name: "rejects null", value: null, error: "這不是 KouKou 的備份檔" },
    { name: "rejects another format", value: { ...makeBackup(), format: "other" }, error: "這不是 KouKou 的備份檔" },
    {
      name: "rejects a missing list",
      value: { ...makeBackup(), subscriptions: undefined },
      error: "備份檔內容不完整",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      if (tt.error) expect(() => readBackupPreview(tt.value)).toThrow(tt.error);
      else expect(readBackupPreview(tt.value)).toEqual(tt.expected);
    });
  }
});
