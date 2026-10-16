// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({ prismaMock: { $queryRaw: vi.fn() } }));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { checkDatabase } from "./healthService";

describe("checkDatabase", () => {
  beforeEach(() => vi.clearAllMocks());

  const tests: { name: string; result: () => Promise<unknown>; error?: string }[] = [
    { name: "resolves when the query succeeds", result: () => Promise.resolve([{ 1: 1 }]) },
    {
      name: "rejects when the database is unreachable",
      result: () => Promise.reject(new Error("db down")),
      error: "db down",
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.$queryRaw.mockImplementation(tt.result);
      const promise = checkDatabase();
      if (tt.error) await expect(promise).rejects.toThrow(tt.error);
      else await expect(promise).resolves.toBeUndefined();
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    });
  }
});
