// @vitest-environment node
import { describe, expect, it } from "vitest";
import { backupSchema } from "@/lib/validation/backupSchema";
import { makeBackup } from "@/test/backup";
import { toBackupSubscriptionDto, toImportRows, type BackupSubscriptionRecord } from "./backupMapper";

const decimal = (value: number) => ({ toFixed: (digits: number) => value.toFixed(digits) });

const record: BackupSubscriptionRecord = {
  id: 1,
  name: "Netflix",
  categoryId: 2,
  paymentMethodId: 3,
  currency: "TWD",
  amount: decimal(390),
  amortize: false,
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  contractEndDate: null,
  note: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  schedules: [{ cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null }],
  amountPeriods: [{ amount: decimal(330), endDate: new Date("2026-03-31T00:00:00.000Z") }],
};

describe("toBackupSubscriptionDto", () => {
  const tests = [
    { name: "serializes a record into its backup entry", record, expected: makeBackup().subscriptions[0] },
    {
      name: "serializes a contract end date",
      record: { ...record, contractEndDate: new Date("2027-03-31T00:00:00.000Z") },
      expected: { ...makeBackup().subscriptions[0], contractEndDate: "2027-03-31" },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toBackupSubscriptionDto(tt.record)).toEqual(tt.expected);
    });
  }
});

describe("toImportRows", () => {
  const backup = makeBackup();
  const tests = [
    {
      name: "keeps ids and links children to their subscription",
      backup,
      expected: {
        categories: backup.categories,
        paymentMethods: backup.paymentMethods,
        subscriptions: [
          {
            id: 1,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            name: "Netflix",
            categoryId: 2,
            paymentMethodId: 3,
            currency: "TWD",
            amount: "390.00",
            amortize: false,
            startDate: new Date("2026-01-01T00:00:00.000Z"),
            contractEndDate: null,
            note: null,
          },
        ],
        schedules: [{ subscriptionId: 1, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null }],
        amountPeriods: [{ subscriptionId: 1, amount: "330.00", endDate: new Date("2026-03-31T00:00:00.000Z") }],
      },
    },
    {
      name: "maps an empty backup to no rows",
      backup: makeBackup({ categories: [], paymentMethods: [], subscriptions: [] }),
      expected: { categories: [], paymentMethods: [], subscriptions: [], schedules: [], amountPeriods: [] },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toImportRows(backupSchema.parse(tt.backup))).toEqual(tt.expected);
    });
  }
});
