// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeBackup } from "@/test/backup";
import { backupSchema } from "./backupSchema";

const backup = makeBackup();
const [category] = backup.categories;
const [paymentMethod] = backup.paymentMethods;
const [subscription] = backup.subscriptions;

describe("backupSchema", () => {
  const tests: {
    name: string;
    input: unknown;
    expected?: Record<string, unknown>;
    /** The issue's path joined with dots, and its message when it matters. */
    error?: { path: string; message?: string };
  }[] = [
    {
      name: "parses a valid backup, converting amounts to numbers",
      input: backup,
      expected: {
        categories: [category],
        paymentMethods: [paymentMethod],
        subscriptions: [
          expect.objectContaining({
            id: 1,
            amount: 390,
            createdAt: "2026-01-01T00:00:00.000Z",
            amountPeriods: [{ amount: 330, endDate: "2026-03-31" }],
          }),
        ],
      },
    },
    { name: "accepts an empty backup", input: makeBackup({ categories: [], paymentMethods: [], subscriptions: [] }) },
    { name: "rejects a non-object", input: "hello", error: { path: "", message: "這不是 KouKou 的備份檔" } },
    {
      name: "rejects another format",
      input: { ...backup, format: "other" },
      error: { path: "format", message: "這不是 KouKou 的備份檔" },
    },
    {
      name: "rejects another version",
      input: { ...backup, version: 2 },
      error: { path: "version", message: "不支援這個版本的備份檔" },
    },
    {
      name: "rejects a missing list",
      input: { ...backup, subscriptions: undefined },
      error: { path: "subscriptions" },
    },
    {
      name: "rejects an invalid record id",
      input: makeBackup({ categories: [{ ...category, id: 0 }] }),
      error: { path: "categories.0.id" },
    },
    {
      name: "rejects a non-integer sort order",
      input: makeBackup({ categories: [{ ...category, sortOrder: 1.5 }] }),
      error: { path: "categories.0.sortOrder" },
    },
    {
      name: "rejects an invalid created-at timestamp",
      input: makeBackup({ subscriptions: [{ ...subscription, createdAt: "yesterday" }] }),
      error: { path: "subscriptions.0.createdAt" },
    },
    {
      name: "applies the subscription field rules",
      input: makeBackup({ subscriptions: [{ ...subscription, schedules: [] }] }),
      error: { path: "subscriptions.0.schedules" },
    },
    {
      name: "applies the subscription date rules",
      input: makeBackup({ subscriptions: [{ ...subscription, contractEndDate: "2025-12-31" }] }),
      error: { path: "subscriptions.0.contractEndDate" },
    },
    {
      name: "rejects duplicate category ids",
      input: makeBackup({ categories: [category, { ...category, name: "其他" }] }),
      error: { path: "categories.1.id", message: "編號重複" },
    },
    {
      name: "rejects duplicate category names",
      input: makeBackup({ categories: [category, { ...category, id: 9 }] }),
      error: { path: "categories.1.name", message: "類型「影音串流」重複" },
    },
    {
      name: "rejects duplicate payment methods of the same type",
      input: makeBackup({ paymentMethods: [paymentMethod, { ...paymentMethod, id: 9 }] }),
      error: { path: "paymentMethods.1.name", message: "扣款方式「國泰 CUBE」重複" },
    },
    {
      name: "accepts payment methods sharing a name across types",
      input: makeBackup({ paymentMethods: [paymentMethod, { ...paymentMethod, id: 9, type: "BANK_ACCOUNT" }] }),
    },
    {
      name: "rejects duplicate subscription ids",
      input: makeBackup({ subscriptions: [subscription, { ...subscription, name: "Spotify" }] }),
      error: { path: "subscriptions.1.id", message: "編號重複" },
    },
    {
      name: "rejects a category missing from the backup",
      input: makeBackup({ subscriptions: [{ ...subscription, categoryId: 99 }] }),
      error: { path: "subscriptions.0.categoryId", message: "「Netflix」的類型不在備份檔中" },
    },
    {
      name: "rejects a payment method missing from the backup",
      input: makeBackup({ subscriptions: [{ ...subscription, paymentMethodId: 99 }] }),
      error: { path: "subscriptions.0.paymentMethodId", message: "「Netflix」的扣款方式不在備份檔中" },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = backupSchema.safeParse(tt.input);
      if (tt.error) {
        expect(result.success).toBe(false);
        const issue = result.error?.issues.find((i) => i.path.join(".") === tt.error!.path);
        expect(issue).toBeDefined();
        if (tt.error.message) expect(issue?.message).toBe(tt.error.message);
      } else {
        expect(result.success).toBe(true);
        if (tt.expected) expect(result.data).toMatchObject(tt.expected);
      }
    });
  }
});
