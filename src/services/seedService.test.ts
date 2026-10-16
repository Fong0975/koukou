// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CATEGORIES, type DefaultCategory } from "@/lib/constants/defaultCategories";
import { loggerMock } from "@/test/logger";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    category: { upsert: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/logger", () => import("@/test/logger"));

import { seedDefaults } from "./seedService";

describe("seedDefaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.category.upsert.mockImplementation((args) => ({ op: "upsert", args }));
    prismaMock.$transaction.mockResolvedValue([]);
  });

  const tests: {
    name: string;
    input?: readonly DefaultCategory[];
    expected: readonly DefaultCategory[];
    error?: string;
  }[] = [
    { name: "uses default categories when no argument is given", input: undefined, expected: DEFAULT_CATEGORIES },
    {
      name: "upserts the given categories",
      input: [{ name: "測試", icon: "🧪", sortOrder: 1 }],
      expected: [{ name: "測試", icon: "🧪", sortOrder: 1 }],
    },
    { name: "handles an empty list", input: [], expected: [] },
    { name: "propagates transaction errors", input: undefined, expected: DEFAULT_CATEGORIES, error: "db down" },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.error) {
        prismaMock.$transaction.mockRejectedValue(new Error(tt.error));
        await expect(seedDefaults(tt.input)).rejects.toThrow(tt.error);
        expect(loggerMock.debug).not.toHaveBeenCalled();
        return;
      }

      const count = await seedDefaults(tt.input);

      expect(count).toBe(tt.expected.length);
      expect(prismaMock.category.upsert).toHaveBeenCalledTimes(tt.expected.length);
      tt.expected.forEach((category, i) => {
        expect(prismaMock.category.upsert).toHaveBeenNthCalledWith(i + 1, {
          where: { name: category.name },
          update: {},
          create: category,
        });
      });
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(tt.expected.length);
      expect(loggerMock.debug).toHaveBeenCalledWith("Default categories ensured", { count: tt.expected.length });
    });
  }
});
