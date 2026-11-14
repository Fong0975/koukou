// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";

const { prismaMock } = await vi.hoisted(async () => {
  const { tableMock, transactionalPrismaMock } = await import("@/test/prismaTable");
  return { prismaMock: transactionalPrismaMock({ row: tableMock() }) };
});

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { sortOrderWrites } from "@/test/prismaTable";
import { createInOrder, saveDisplayOrder } from "./lookupTable";

const setSortOrder = (_tx: unknown, id: number, sortOrder: number) =>
  prismaMock.row.update({ where: { id }, data: { sortOrder } });

describe("createInOrder", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: {
    name: string;
    siblings: { id: number; name: string; sortOrder: number }[];
    createdAt: number;
    moves: [number, number][];
  }[] = [
    { name: "creates the first row", siblings: [], createdAt: 10, moves: [] },
    {
      name: "appends after the last row",
      siblings: [
        { id: 1, name: "a", sortOrder: 10 },
        { id: 2, name: "b", sortOrder: 20 },
      ],
      createdAt: 30,
      moves: [],
    },
    {
      name: "takes the place of a last row that stays last and moves it down",
      siblings: [
        { id: 1, name: "a", sortOrder: 10 },
        { id: 2, name: "last", sortOrder: 20 },
      ],
      createdAt: 20,
      moves: [[2, 30]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.row.create.mockImplementation((sortOrder: number) => Promise.resolve({ id: 9, sortOrder }));

      const created = await createInOrder({
        siblings: () => Promise.resolve(tt.siblings),
        staysLast: (row) => row.name === "last",
        create: (_tx, sortOrder) => prismaMock.row.create(sortOrder),
        setSortOrder,
      });

      expect(created).toEqual({ id: 9, sortOrder: tt.createdAt });
      expect(sortOrderWrites(prismaMock.row.update)).toEqual(tt.moves);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  }
});

describe("saveDisplayOrder", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: { name: string; ids: number[]; expected?: [number, number][] }[] = [
    {
      name: "renumbers sortOrder in steps of 10 following the given order",
      ids: [3, 1, 2],
      expected: [
        [3, 10],
        [1, 20],
        [2, 30],
      ],
    },
    { name: "rejects a missing id without writing", ids: [1, 2] },
    { name: "rejects an unknown id without writing", ids: [1, 2, 9] },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const promise = saveDisplayOrder(
        tt.ids,
        { listIds: () => Promise.resolve([{ id: 1 }, { id: 2 }, { id: 3 }]), setSortOrder },
        "不一致",
      );

      if (tt.expected) await expect(promise).resolves.toBeUndefined();
      else await expect(promise).rejects.toThrow(new ValidationError("不一致"));
      expect(sortOrderWrites(prismaMock.row.update)).toEqual(tt.expected ?? []);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  }
});
