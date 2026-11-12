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
  pauses: [{ startDate: new Date("2026-05-01T00:00:00.000Z"), endDate: new Date("2026-06-30T00:00:00.000Z") }],
  reminders: [{ kind: "CHARGE", daysBefore: 0 }],
};

describe("toBackupSubscriptionDto", () => {
  const tests = [
    { name: "serializes a record into its backup entry", record, expected: makeBackup().subscriptions[0] },
    {
      name: "serializes a contract end date",
      record: { ...record, contractEndDate: new Date("2027-03-31T00:00:00.000Z") },
      expected: { ...makeBackup().subscriptions[0], contractEndDate: "2027-03-31" },
    },
    {
      name: "serializes a subscription without pauses",
      record: { ...record, pauses: [] },
      expected: { ...makeBackup().subscriptions[0], pauses: [] },
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
        pauses: [
          {
            subscriptionId: 1,
            startDate: new Date("2026-05-01T00:00:00.000Z"),
            endDate: new Date("2026-06-30T00:00:00.000Z"),
          },
        ],
        reminders: [{ subscriptionId: 1, kind: "CHARGE", daysBefore: 0 }],
        notificationSetting: backup.notificationSetting,
      },
    },
    {
      name: "maps an empty backup without settings to no rows",
      backup: makeBackup({ categories: [], paymentMethods: [], subscriptions: [], notificationSetting: undefined }),
      expected: {
        categories: [],
        paymentMethods: [],
        subscriptions: [],
        schedules: [],
        amountPeriods: [],
        pauses: [],
        reminders: [],
        notificationSetting: null,
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toImportRows(backupSchema.parse(tt.backup))).toEqual(tt.expected);
    });
  }
});

describe("toImportRows payment method order", () => {
  const card = { id: 3, type: "CREDIT_CARD", name: "國泰 CUBE", note: null } as const;
  const amex = { id: 6, type: "CREDIT_CARD", name: "Amex", note: null } as const;
  const richart = { id: 4, type: "BANK_ACCOUNT", name: "台新 Richart", note: null } as const;
  const sortOrders = (backup: unknown) =>
    toImportRows(backupSchema.parse(backup)).paymentMethods.map(({ id, sortOrder }) => [id, sortOrder]);
  const withoutSubscriptions = (paymentMethods: unknown[]) => ({
    ...makeBackup({ subscriptions: [] }),
    paymentMethods,
  });

  const tests: { name: string; paymentMethods: unknown[]; expected: [number, number][] }[] = [
    {
      name: "keeps the sortOrder written in the backup",
      paymentMethods: [
        { ...card, sortOrder: 30 },
        { ...amex, sortOrder: 20 },
      ],
      expected: [
        [3, 30],
        [6, 20],
      ],
    },
    {
      name: "a backup without sortOrder is numbered by type, then name",
      paymentMethods: [richart, card, amex],
      expected: [
        [4, 30],
        [3, 20],
        [6, 10],
      ],
    },
    {
      name: "a method without sortOrder is numbered by the legacy order while others keep theirs",
      paymentMethods: [{ ...card, sortOrder: 500 }, amex],
      expected: [
        [3, 500],
        [6, 10],
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(sortOrders(withoutSubscriptions(tt.paymentMethods))).toEqual(tt.expected);
    });
  }
});
