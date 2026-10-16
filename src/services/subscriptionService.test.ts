// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { SubscriptionData } from "@/lib/validation/subscriptionSchema";
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
  note: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  category: { id: 2, name: "影音串流", icon: "🎬", sortOrder: 20 },
  paymentMethod: { id: 3, type: "CREDIT_CARD", name: "國泰 CUBE", note: null },
  schedules: [
    { id: 10, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 1, month: null },
    { id: 11, cycle: "MONTHLY", dayOfWeek: null, dayOfMonth: 15, month: null },
  ],
};

const data: SubscriptionData = {
  name: "Netflix",
  categoryId: 2,
  paymentMethodId: 3,
  currency: "TWD",
  amount: 390,
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
  note: null,
};

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
  const tests: { name: string; result: () => Promise<unknown>; error?: ErrorCtor }[] = [
    { name: "creates with nested schedules", result: () => Promise.resolve(record) },
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
      const promise = createSubscription(data);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        return;
      }
      await expect(promise).resolves.toMatchObject({ id: 1, amount: "390.00" });
      expect(prismaMock.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { ...columns, schedules: { create: data.schedules } } }),
      );
    });
  }
});

describe("updateSubscription", () => {
  const tests: { name: string; result: () => Promise<unknown>; error?: ErrorCtor }[] = [
    { name: "replaces fields and all schedules", result: () => Promise.resolve(record) },
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
        return;
      }
      await expect(promise).resolves.toMatchObject({ id: 1 });
      expect(prismaMock.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { ...columns, schedules: { deleteMany: {}, create: data.schedules } },
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
      expect(prismaMock.subscription.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  }
});
