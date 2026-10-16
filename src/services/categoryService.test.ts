// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/lib/errors";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { category: { findMany: vi.fn(), create: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { prismaError } from "@/test/prismaError";
import { createCategory, listCategories } from "./categoryService";

describe("listCategories", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: { name: string; result: () => Promise<unknown>; expected?: unknown; error?: string }[] = [
    {
      name: "returns rows ordered by sortOrder then id",
      result: () => Promise.resolve([{ id: 1, name: "網站會員", icon: "🌐", sortOrder: 10 }]),
      expected: [{ id: 1, name: "網站會員", icon: "🌐", sortOrder: 10 }],
    },
    { name: "returns empty list", result: () => Promise.resolve([]), expected: [] },
    { name: "propagates DB errors", result: () => Promise.reject(new Error("db down")), error: "db down" },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.category.findMany.mockImplementation(tt.result);
      const promise = listCategories();
      if (tt.error) await expect(promise).rejects.toThrow(tt.error);
      else await expect(promise).resolves.toEqual(tt.expected);
      expect(prismaMock.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      );
    });
  }
});

describe("createCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  const data = { name: "健身房", icon: "🏋️" };
  const tests: { name: string; setup: () => void; expected?: unknown; error?: new (...args: never[]) => Error }[] = [
    {
      name: "creates with sortOrder before 其他",
      setup: () => prismaMock.category.create.mockResolvedValue({ id: 9, ...data, sortOrder: 500 }),
      expected: { id: 9, ...data, sortOrder: 500 },
    },
    {
      name: "duplicate name → ConflictError",
      setup: () => prismaMock.category.create.mockRejectedValue(prismaError("P2002")),
      error: ConflictError,
    },
    {
      name: "unknown errors propagate",
      setup: () => prismaMock.category.create.mockRejectedValue(new Error("db down")),
      error: Error,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      tt.setup();
      const promise = createCategory(data);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
      } else {
        await expect(promise).resolves.toEqual(tt.expected);
        expect(prismaMock.category.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: { ...data, sortOrder: 500 } }),
        );
      }
    });
  }
});
