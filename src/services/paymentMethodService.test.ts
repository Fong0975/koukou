// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    paymentMethod: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/logger", () => import("@/test/logger"));

import { loggerMock } from "@/test/logger";
import { prismaError } from "@/test/prismaError";
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  reorderPaymentMethods,
  updatePaymentMethod,
} from "./paymentMethodService";

describe("listPaymentMethods", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: { name: string; result: () => Promise<unknown>; expected?: unknown; error?: string }[] = [
    {
      name: "returns rows ordered by type, sortOrder then id",
      result: () => Promise.resolve([{ id: 1, type: "CREDIT_CARD", name: "國泰 CUBE", note: null, sortOrder: 10 }]),
      expected: [{ id: 1, type: "CREDIT_CARD", name: "國泰 CUBE", note: null, sortOrder: 10 }],
    },
    { name: "returns empty list", result: () => Promise.resolve([]), expected: [] },
    { name: "propagates DB errors", result: () => Promise.reject(new Error("db down")), error: "db down" },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.paymentMethod.findMany.mockImplementation(tt.result);
      const promise = listPaymentMethods();
      if (tt.error) await expect(promise).rejects.toThrow(tt.error);
      else await expect(promise).resolves.toEqual(tt.expected);
      if (tt.error) expect(loggerMock.debug).not.toHaveBeenCalled();
      else
        expect(loggerMock.debug).toHaveBeenCalledWith("Payment methods listed", {
          count: (tt.expected as unknown[]).length,
        });
      expect(prismaMock.paymentMethod.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { id: "asc" }] }),
      );
    });
  }
});

describe("createPaymentMethod", () => {
  beforeEach(() => vi.clearAllMocks());

  const data = { type: "CREDIT_CARD" as const, name: "國泰 CUBE", note: null };
  const tests: { name: string; setup: () => void; expected?: unknown; error?: new (...args: never[]) => Error }[] = [
    {
      name: "creates a payment method after the reordered ones",
      setup: () => prismaMock.paymentMethod.create.mockResolvedValue({ id: 1, ...data, sortOrder: 500 }),
      expected: { id: 1, ...data, sortOrder: 500 },
    },
    {
      name: "duplicate type + name → ConflictError",
      setup: () => prismaMock.paymentMethod.create.mockRejectedValue(prismaError("P2002")),
      error: ConflictError,
    },
    {
      name: "unknown errors propagate",
      setup: () => prismaMock.paymentMethod.create.mockRejectedValue(new Error("db down")),
      error: Error,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      tt.setup();
      const promise = createPaymentMethod(data);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toEqual(tt.expected);
        expect(loggerMock.info).toHaveBeenCalledWith("Payment method created", {
          id: 1,
          type: "CREDIT_CARD",
          name: "國泰 CUBE",
        });
        expect(prismaMock.paymentMethod.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: { ...data, sortOrder: 500 } }),
        );
      }
    });
  }
});

describe("updatePaymentMethod", () => {
  beforeEach(() => vi.clearAllMocks());

  const data = { type: "BANK_ACCOUNT" as const, name: "台新 Richart", note: "薪轉" };
  const tests: { name: string; setup: () => void; expected?: unknown; error?: new (...args: never[]) => Error }[] = [
    {
      name: "updates type, name and note",
      setup: () => prismaMock.paymentMethod.update.mockResolvedValue({ id: 7, ...data }),
      expected: { id: 7, ...data },
    },
    {
      name: "missing payment method → NotFoundError",
      setup: () => prismaMock.paymentMethod.update.mockRejectedValue(prismaError("P2025")),
      error: NotFoundError,
    },
    {
      name: "duplicate type + name → ConflictError",
      setup: () => prismaMock.paymentMethod.update.mockRejectedValue(prismaError("P2002")),
      error: ConflictError,
    },
    {
      name: "unknown errors propagate",
      setup: () => prismaMock.paymentMethod.update.mockRejectedValue(new Error("db down")),
      error: Error,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      tt.setup();
      const promise = updatePaymentMethod(7, data);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toEqual(tt.expected);
        expect(loggerMock.info).toHaveBeenCalledWith("Payment method updated", {
          id: 7,
          type: "BANK_ACCOUNT",
          name: "台新 Richart",
        });
        expect(prismaMock.paymentMethod.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 7 }, data }),
        );
      }
    });
  }
});

describe("deletePaymentMethod", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: { name: string; setup: () => void; error?: new (...args: never[]) => Error }[] = [
    { name: "deletes an unused payment method", setup: () => prismaMock.paymentMethod.delete.mockResolvedValue({}) },
    {
      name: "missing payment method → NotFoundError",
      setup: () => prismaMock.paymentMethod.delete.mockRejectedValue(prismaError("P2025")),
      error: NotFoundError,
    },
    {
      name: "payment method in use → ValidationError",
      setup: () => prismaMock.paymentMethod.delete.mockRejectedValue(prismaError("P2003")),
      error: ValidationError,
    },
    {
      name: "unknown errors propagate",
      setup: () => prismaMock.paymentMethod.delete.mockRejectedValue(new Error("db down")),
      error: Error,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      tt.setup();
      const promise = deletePaymentMethod(7);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toBeUndefined();
        expect(loggerMock.info).toHaveBeenCalledWith("Payment method deleted", { id: 7 });
      }
      expect(prismaMock.paymentMethod.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    });
  }
});

describe("reorderPaymentMethods", () => {
  beforeEach(() => vi.clearAllMocks());

  const existing = [{ id: 3 }, { id: 4 }, { id: 5 }];
  const reordered = [{ id: 5, type: "CREDIT_CARD", name: "c", note: null, sortOrder: 10 }];
  const tests: { name: string; ids: number[]; expectedSortOrders?: [number, number][]; error?: boolean }[] = [
    {
      name: "renumbers sortOrder in steps of 10 following the given order",
      ids: [5, 3, 4],
      expectedSortOrders: [
        [5, 10],
        [3, 20],
        [4, 30],
      ],
    },
    { name: "rejects a missing id", ids: [3, 4], error: true },
    { name: "rejects an unknown id", ids: [3, 4, 9], error: true },
    { name: "rejects duplicated ids", ids: [3, 3, 4], error: true },
    { name: "rejects extra ids", ids: [3, 4, 5, 6], error: true },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.paymentMethod.findMany.mockResolvedValueOnce(existing).mockResolvedValueOnce(reordered);
      prismaMock.paymentMethod.update.mockImplementation((args: unknown) => args);
      prismaMock.$transaction.mockResolvedValue([]);

      const promise = reorderPaymentMethods(tt.ids);

      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(ValidationError);
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toEqual(reordered);
        const updates = prismaMock.paymentMethod.update.mock.calls.map((call) => {
          const args = call[0] as { where: { id: number }; data: { sortOrder: number } };
          return [args.where.id, args.data.sortOrder];
        });
        expect(updates).toEqual(tt.expectedSortOrders);
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(loggerMock.info).toHaveBeenCalledWith("Payment methods reordered", { count: 3 });
      }
    });
  }
});
