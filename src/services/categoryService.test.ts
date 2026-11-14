// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

const { prismaMock } = await vi.hoisted(async () => {
  const { tableMock, transactionalPrismaMock } = await import("@/test/prismaTable");
  return { prismaMock: transactionalPrismaMock({ category: tableMock() }) };
});

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/logger", () => import("@/test/logger"));

import { loggerMock } from "@/test/logger";
import { prismaError } from "@/test/prismaError";
import { sortOrderWrites } from "@/test/prismaTable";
import { createCategory, deleteCategory, listCategories, reorderCategories, updateCategory } from "./categoryService";

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
      if (tt.error) expect(loggerMock.debug).not.toHaveBeenCalled();
      else
        expect(loggerMock.debug).toHaveBeenCalledWith("Categories listed", {
          count: (tt.expected as unknown[]).length,
        });
      expect(prismaMock.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      );
    });
  }
});

describe("createCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  const data = { name: "健身房", icon: "🏋️" };
  const seeded = [
    { id: 6, name: "水電瓦斯", sortOrder: 60 },
    { id: 7, name: "其他", sortOrder: 999 },
  ];
  const reordered = [
    { id: 7, name: "其他", sortOrder: 10 },
    { id: 6, name: "水電瓦斯", sortOrder: 20 },
  ];
  const tests: {
    name: string;
    siblings: { id: number; name: string; sortOrder: number }[];
    create: () => Promise<unknown>;
    sortOrder?: number;
    moves?: [number, number][];
    error?: new (...args: never[]) => Error;
  }[] = [
    {
      name: "creates before 其他 and moves it one step down",
      siblings: seeded,
      create: () => Promise.resolve({ id: 9, ...data, sortOrder: 999 }),
      sortOrder: 999,
      moves: [[7, 1009]],
    },
    {
      name: "creates after the last category once 其他 is not last",
      siblings: reordered,
      create: () => Promise.resolve({ id: 9, ...data, sortOrder: 30 }),
      sortOrder: 30,
      moves: [],
    },
    {
      name: "duplicate name → ConflictError",
      siblings: seeded,
      create: () => Promise.reject(prismaError("P2002")),
      error: ConflictError,
    },
    {
      name: "unknown errors propagate",
      siblings: seeded,
      create: () => Promise.reject(new Error("db down")),
      error: Error,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.category.findMany.mockResolvedValue(tt.siblings);
      prismaMock.category.create.mockImplementation(tt.create);
      const promise = createCategory(data);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toEqual({ id: 9, ...data, sortOrder: tt.sortOrder });
        expect(loggerMock.info).toHaveBeenCalledWith("Category created", { id: 9, name: "健身房" });
        expect(prismaMock.category.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: { ...data, sortOrder: tt.sortOrder } }),
        );
        expect(sortOrderWrites(prismaMock.category.update)).toEqual(tt.moves);
      }
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  }
});

describe("updateCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  const data = { name: "健身房", icon: "🏋️" };
  const tests: { name: string; setup: () => void; expected?: unknown; error?: new (...args: never[]) => Error }[] = [
    {
      name: "updates name and icon",
      setup: () => prismaMock.category.update.mockResolvedValue({ id: 9, ...data, sortOrder: 500 }),
      expected: { id: 9, ...data, sortOrder: 500 },
    },
    {
      name: "missing category → NotFoundError",
      setup: () => prismaMock.category.update.mockRejectedValue(prismaError("P2025")),
      error: NotFoundError,
    },
    {
      name: "duplicate name → ConflictError",
      setup: () => prismaMock.category.update.mockRejectedValue(prismaError("P2002")),
      error: ConflictError,
    },
    {
      name: "unknown errors propagate",
      setup: () => prismaMock.category.update.mockRejectedValue(new Error("db down")),
      error: Error,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      tt.setup();
      const promise = updateCategory(9, data);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toEqual(tt.expected);
        expect(loggerMock.info).toHaveBeenCalledWith("Category updated", { id: 9, name: "健身房" });
        expect(prismaMock.category.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 9 }, data }));
      }
    });
  }
});

describe("deleteCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: { name: string; setup: () => void; error?: new (...args: never[]) => Error }[] = [
    { name: "deletes an unused category", setup: () => prismaMock.category.delete.mockResolvedValue({}) },
    {
      name: "missing category → NotFoundError",
      setup: () => prismaMock.category.delete.mockRejectedValue(prismaError("P2025")),
      error: NotFoundError,
    },
    {
      name: "category in use → ValidationError",
      setup: () => prismaMock.category.delete.mockRejectedValue(prismaError("P2003")),
      error: ValidationError,
    },
    {
      name: "unknown errors propagate",
      setup: () => prismaMock.category.delete.mockRejectedValue(new Error("db down")),
      error: Error,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      tt.setup();
      const promise = deleteCategory(9);
      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(tt.error);
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toBeUndefined();
        expect(loggerMock.info).toHaveBeenCalledWith("Category deleted", { id: 9 });
      }
      expect(prismaMock.category.delete).toHaveBeenCalledWith({ where: { id: 9 } });
    });
  }
});

describe("reorderCategories", () => {
  beforeEach(() => vi.clearAllMocks());

  const existing = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const reordered = [{ id: 3, name: "c", icon: null, sortOrder: 10 }];
  const tests: { name: string; ids: number[]; expectedSortOrders?: [number, number][]; error?: boolean }[] = [
    {
      name: "renumbers sortOrder in steps of 10 following the given order",
      ids: [3, 1, 2],
      expectedSortOrders: [
        [3, 10],
        [1, 20],
        [2, 30],
      ],
    },
    { name: "rejects a missing id", ids: [1, 2], error: true },
    { name: "rejects an unknown id", ids: [1, 2, 9], error: true },
    { name: "rejects duplicated ids", ids: [1, 1, 2], error: true },
    { name: "rejects extra ids", ids: [1, 2, 3, 4], error: true },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.category.findMany.mockResolvedValueOnce(existing).mockResolvedValueOnce(reordered);
      prismaMock.category.update.mockResolvedValue({});

      const promise = reorderCategories(tt.ids);

      if (tt.error) {
        await expect(promise).rejects.toBeInstanceOf(ValidationError);
        expect(prismaMock.category.update).not.toHaveBeenCalled();
        expect(loggerMock.info).not.toHaveBeenCalled();
      } else {
        await expect(promise).resolves.toEqual(reordered);
        expect(sortOrderWrites(prismaMock.category.update)).toEqual(tt.expectedSortOrders);
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(loggerMock.info).toHaveBeenCalledWith("Categories reordered", { count: 3 });
      }
    });
  }
});
