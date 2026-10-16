// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/lib/errors";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { paymentMethod: { findMany: vi.fn(), create: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { prismaError } from "@/test/prismaError";
import { createPaymentMethod, listPaymentMethods } from "./paymentMethodService";

describe("listPaymentMethods", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: { name: string; result: () => Promise<unknown>; expected?: unknown; error?: string }[] = [
    {
      name: "returns rows ordered by type then name",
      result: () => Promise.resolve([{ id: 1, type: "CREDIT_CARD", name: "國泰 CUBE", note: null }]),
      expected: [{ id: 1, type: "CREDIT_CARD", name: "國泰 CUBE", note: null }],
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
      expect(prismaMock.paymentMethod.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ type: "asc" }, { name: "asc" }] }),
      );
    });
  }
});

describe("createPaymentMethod", () => {
  beforeEach(() => vi.clearAllMocks());

  const data = { type: "CREDIT_CARD" as const, name: "國泰 CUBE", note: null };
  const tests: { name: string; setup: () => void; expected?: unknown; error?: new (...args: never[]) => Error }[] = [
    {
      name: "creates a payment method",
      setup: () => prismaMock.paymentMethod.create.mockResolvedValue({ id: 1, ...data }),
      expected: { id: 1, ...data },
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
      } else {
        await expect(promise).resolves.toEqual(tt.expected);
        expect(prismaMock.paymentMethod.create).toHaveBeenCalledWith(expect.objectContaining({ data }));
      }
    });
  }
});
