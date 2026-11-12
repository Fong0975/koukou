// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, ValidationError } from "@/lib/errors";
import { backupSchema } from "@/lib/validation/backupSchema";
import { makeBackup } from "@/test/backup";
import { loggerMock } from "@/test/logger";
import { prismaError } from "@/test/prismaError";

const { prismaMock } = vi.hoisted(() => {
  /** A table mock whose calls return a tag naming the operation, to check the transaction order. */
  const table = (name: string) => ({
    findMany: vi.fn(),
    deleteMany: vi.fn(() => `${name}.deleteMany`),
    createMany: vi.fn(() => `${name}.createMany`),
  });
  return {
    prismaMock: {
      $transaction: vi.fn(),
      category: table("category"),
      paymentMethod: table("paymentMethod"),
      subscription: table("subscription"),
      billingSchedule: table("billingSchedule"),
      subscriptionAmountPeriod: table("subscriptionAmountPeriod"),
      subscriptionPause: table("subscriptionPause"),
      subscriptionReminder: table("subscriptionReminder"),
      notificationSetting: { findUnique: vi.fn(), upsert: vi.fn(() => "notificationSetting.upsert") },
    },
  };
});

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/logger", () => import("@/test/logger"));
vi.mock("@/lib/appVersion", () => ({ APP_VERSION_LABEL: "v1.0.12" }));

import { exportBackup, importBackup } from "./backupService";

type ErrorCtor = new (...args: never[]) => Error;

const decimal = (value: number) => ({ toFixed: (digits: number) => value.toFixed(digits) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ now: new Date("2026-10-19T08:00:00.000Z") });
});

afterEach(() => vi.useRealTimers());

describe("exportBackup", () => {
  const backup = makeBackup();
  const tests = [
    {
      name: "reads every table into a backup",
      categories: backup.categories,
      paymentMethods: backup.paymentMethods,
      subscriptions: [
        {
          ...backup.subscriptions[0],
          amount: decimal(390),
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          amountPeriods: [{ amount: decimal(330), endDate: new Date("2026-03-31T00:00:00.000Z") }],
          pauses: [{ startDate: new Date("2026-05-01T00:00:00.000Z"), endDate: new Date("2026-06-30T00:00:00.000Z") }],
          reminders: [{ kind: "CHARGE", daysBefore: 0 }],
        },
      ],
      notificationSetting: backup.notificationSetting,
      expected: backup,
      expectedCounts: { categories: 1, paymentMethods: 1, subscriptions: 1 },
    },
    {
      name: "exports an empty database",
      categories: [],
      paymentMethods: [],
      subscriptions: [],
      notificationSetting: null,
      expected: makeBackup({
        categories: [],
        paymentMethods: [],
        subscriptions: [],
        notificationSetting: { enabled: false, monthlySummaryEnabled: true, sendTime: "09:00" },
      }),
      expectedCounts: { categories: 0, paymentMethods: 0, subscriptions: 0 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.category.findMany.mockResolvedValue(tt.categories);
      prismaMock.paymentMethod.findMany.mockResolvedValue(tt.paymentMethods);
      prismaMock.subscription.findMany.mockResolvedValue(tt.subscriptions);
      prismaMock.notificationSetting.findUnique.mockResolvedValue(tt.notificationSetting);

      await expect(exportBackup()).resolves.toEqual(tt.expected);
      for (const table of [prismaMock.category, prismaMock.paymentMethod, prismaMock.subscription]) {
        expect(table.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { id: "asc" } }));
      }
      expect(loggerMock.info).toHaveBeenCalledWith("Backup exported", tt.expectedCounts);
    });
  }
});

describe("importBackup", () => {
  const data = backupSchema.parse(makeBackup());
  const tableOperations = [
    "subscription.deleteMany",
    "category.deleteMany",
    "paymentMethod.deleteMany",
    "category.createMany",
    "paymentMethod.createMany",
    "subscription.createMany",
    "billingSchedule.createMany",
    "subscriptionAmountPeriod.createMany",
    "subscriptionPause.createMany",
    "subscriptionReminder.createMany",
  ];
  const tests: {
    name: string;
    data?: typeof data;
    operations: string[];
    failure?: Error;
    error?: ErrorCtor;
    message?: string;
  }[] = [
    {
      name: "replaces every table and the settings in one transaction",
      operations: [...tableOperations, "notificationSetting.upsert"],
    },
    {
      name: "keeps the current settings for a backup without them",
      data: { ...data, notificationSetting: undefined },
      operations: tableOperations,
    },
    {
      name: "duplicate name → ConflictError",
      operations: [...tableOperations, "notificationSetting.upsert"],
      failure: prismaError("P2002"),
      error: ConflictError,
      message: "備份檔中有重複的類型或扣款方式名稱",
    },
    {
      name: "missing reference → ValidationError",
      operations: [...tableOperations, "notificationSetting.upsert"],
      failure: prismaError("P2003"),
      error: ValidationError,
      message: "備份檔中的扣款項目參照了不存在的類型或扣款方式",
    },
    {
      name: "propagates other errors",
      operations: [...tableOperations, "notificationSetting.upsert"],
      failure: new Error("db down"),
      error: Error,
      message: "db down",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.failure) prismaMock.$transaction.mockRejectedValue(tt.failure);
      else prismaMock.$transaction.mockResolvedValue([]);

      const promise = importBackup(tt.data ?? data);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        await expect(promise).rejects.toThrow(tt.message);
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toEqual({ categories: 1, paymentMethods: 1, subscriptions: 1 });
        expect(loggerMock.info).toHaveBeenCalledWith("Backup imported", {
          categories: 1,
          paymentMethods: 1,
          subscriptions: 1,
        });
      }

      expect(prismaMock.$transaction).toHaveBeenCalledWith(tt.operations);
      expect(prismaMock.category.createMany).toHaveBeenCalledWith({ data: data.categories });
      expect(prismaMock.subscription.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ id: 1, amount: "390.00", createdAt: new Date("2026-01-01T00:00:00.000Z") })],
      });
      expect(prismaMock.billingSchedule.createMany).toHaveBeenCalledWith({
        data: [{ subscriptionId: 1, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null }],
      });
      expect(prismaMock.subscriptionAmountPeriod.createMany).toHaveBeenCalledWith({
        data: [{ subscriptionId: 1, amount: "330.00", endDate: new Date("2026-03-31T00:00:00.000Z") }],
      });
      expect(prismaMock.subscriptionReminder.createMany).toHaveBeenCalledWith({
        data: [{ subscriptionId: 1, kind: "CHARGE", daysBefore: 0 }],
      });
      if (tt.operations.includes("notificationSetting.upsert")) {
        expect(prismaMock.notificationSetting.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 1 },
            update: { enabled: true, monthlySummaryEnabled: false, sendTime: "08:30" },
          }),
        );
      } else {
        expect(prismaMock.notificationSetting.upsert).not.toHaveBeenCalled();
      }
    });
  }
});
