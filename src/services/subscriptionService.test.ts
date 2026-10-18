// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { SubscriptionData } from "@/lib/validation/subscriptionSchema";
import { loggerMock } from "@/test/logger";
import { prismaError } from "@/test/prismaError";
import type { SubscriptionRecord } from "./subscriptionMapper";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    subscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/logger", () => import("@/test/logger"));

import {
  createSubscription,
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  updateSubscription,
} from "./subscriptionService";

type ErrorCtor = new (...args: never[]) => Error;

const record: SubscriptionRecord = {
  id: 1,
  name: "Netflix",
  currency: "TWD",
  amount: { toFixed: (d: number) => (390).toFixed(d) },
  amortize: true,
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  contractEndDate: new Date("2027-03-31T00:00:00.000Z"),
  note: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  category: { id: 2, name: "影音串流", icon: "🎬", sortOrder: 20 },
  paymentMethod: { id: 3, type: "CREDIT_CARD", name: "國泰 CUBE", note: null },
  schedules: [
    { id: 10, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null },
    { id: 11, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null },
  ],
  amountPeriods: [
    { id: 20, amount: { toFixed: (d: number) => (330).toFixed(d) }, endDate: new Date("2026-03-31T00:00:00.000Z") },
  ],
};

const data: SubscriptionData = {
  name: "Netflix",
  categoryId: 2,
  paymentMethodId: 3,
  currency: "TWD",
  amount: 390,
  amortize: true,
  startDate: "2026-01-01",
  contractEndDate: "2027-03-31",
  amountPeriods: [{ amount: 330, endDate: "2026-03-31" }],
  note: null,
  schedules: [
    { cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null },
    { cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null },
  ],
};

const columns = {
  name: "Netflix",
  categoryId: 2,
  paymentMethodId: 3,
  currency: "TWD",
  amount: "390.00",
  amortize: true,
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  contractEndDate: new Date("2027-03-31T00:00:00.000Z"),
  note: null,
};

const amountPeriodRows = [{ amount: "330.00", endDate: new Date("2026-03-31T00:00:00.000Z") }];

beforeEach(() => vi.clearAllMocks());

describe("listSubscriptions", () => {
  const tests = [
    { name: "maps every record to a DTO", rows: [record], expectedLength: 1 },
    { name: "returns empty list", rows: [], expectedLength: 0 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.subscription.findMany.mockResolvedValue(tt.rows);
      const result = await listSubscriptions();
      expect(result).toHaveLength(tt.expectedLength);
      if (tt.expectedLength) expect(result[0].amount).toBe("390.00");
      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
      );
      expect(loggerMock.debug).toHaveBeenCalledWith("Subscriptions listed", { count: tt.expectedLength });
    });
  }
});

describe("getSubscription", () => {
  const tests: { name: string; row: SubscriptionRecord | null; error?: ErrorCtor }[] = [
    { name: "returns the DTO", row: record },
    { name: "missing → NotFoundError", row: null, error: NotFoundError },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(tt.row);
      const promise = getSubscription(1);
      if (tt.error) await expect(promise).rejects.toBeInstanceOf(tt.error);
      else await expect(promise).resolves.toMatchObject({ id: 1, schedules: record.schedules });
    });
  }
});

describe("createSubscription", () => {
  const tests: {
    name: string;
    result: () => Promise<unknown>;
    input?: SubscriptionData;
    expectedColumns?: Record<string, unknown>;
    error?: ErrorCtor;
  }[] = [
    { name: "creates with nested schedules", result: () => Promise.resolve(record) },
    {
      name: "stores a missing contract end date as null",
      result: () => Promise.resolve(record),
      input: { ...data, contractEndDate: null },
      expectedColumns: { ...columns, contractEndDate: null },
    },
    {
      name: "missing category/payment method → ValidationError",
      result: () => Promise.reject(prismaError("P2003")),
      error: ValidationError,
    },
    { name: "unknown errors propagate", result: () => Promise.reject(new Error("db down")), error: Error },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.subscription.create.mockImplementation(tt.result);
      const promise = createSubscription(tt.input ?? data);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
        return;
      }
      await expect(promise).resolves.toMatchObject({
        id: 1,
        amount: "390.00",
        amortize: true,
        startDate: "2026-01-01",
        contractEndDate: "2027-03-31",
        amountPeriods: [{ id: 20, amount: "330.00", endDate: "2026-03-31" }],
      });
      expect(loggerMock.info).toHaveBeenCalledWith("Subscription created", { id: 1, schedules: 2, amountPeriods: 1 });
      expect(prismaMock.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            ...(tt.expectedColumns ?? columns),
            schedules: { create: data.schedules },
            amountPeriods: { create: amountPeriodRows },
          },
        }),
      );
    });
  }
});

describe("updateSubscription", () => {
  const tests: { name: string; result: () => Promise<unknown>; error?: ErrorCtor }[] = [
    { name: "replaces fields, all schedules and all past amounts", result: () => Promise.resolve(record) },
    {
      name: "missing subscription → NotFoundError",
      result: () => Promise.reject(prismaError("P2025")),
      error: NotFoundError,
    },
    {
      name: "missing category/payment method → ValidationError",
      result: () => Promise.reject(prismaError("P2003")),
      error: ValidationError,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.subscription.update.mockImplementation(tt.result);
      const promise = updateSubscription(1, data);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
        return;
      }
      await expect(promise).resolves.toMatchObject({ id: 1 });
      expect(loggerMock.info).toHaveBeenCalledWith("Subscription updated", { id: 1, schedules: 2, amountPeriods: 1 });
      expect(prismaMock.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: {
            ...columns,
            schedules: { deleteMany: {}, create: data.schedules },
            amountPeriods: { deleteMany: {}, create: amountPeriodRows },
          },
        }),
      );
    });
  }
});

describe("deleteSubscription", () => {
  const tests: { name: string; result: () => Promise<unknown>; error?: ErrorCtor }[] = [
    { name: "deletes by id", result: () => Promise.resolve(record) },
    { name: "missing → NotFoundError", result: () => Promise.reject(prismaError("P2025")), error: NotFoundError },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.subscription.delete.mockImplementation(tt.result);
      const promise = deleteSubscription(1);
      if (tt.error) await expect(promise).rejects.toBeInstanceOf(tt.error);
      else await expect(promise).resolves.toBeUndefined();
      if (tt.error) expect(loggerMock.info).not.toHaveBeenCalled();
      else expect(loggerMock.info).toHaveBeenCalledWith("Subscription deleted", { id: 1 });
      expect(prismaMock.subscription.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  }
});
