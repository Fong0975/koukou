import { describe, expect, it } from "vitest";
import { makeBackup } from "@/test/backup";
import { countBackupRecords } from "./backupCounts";

describe("countBackupRecords", () => {
  const tests = [
    {
      name: "counts each list",
      backup: makeBackup(),
      expected: { categories: 1, paymentMethods: 1, subscriptions: 1 },
    },
    {
      name: "counts empty lists as zero",
      backup: makeBackup({ categories: [], paymentMethods: [], subscriptions: [] }),
      expected: { categories: 0, paymentMethods: 0, subscriptions: 0 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(countBackupRecords(tt.backup)).toEqual(tt.expected);
    });
  }
});
