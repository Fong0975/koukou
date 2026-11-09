// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";
import { makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({ serviceMock: { reorderCategories: vi.fn() } }));

vi.mock("@/services/categoryService", () => serviceMock);

import { PUT } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PUT /api/categories/order", () => {
  const tests: {
    name: string;
    body: unknown;
    result?: () => Promise<unknown>;
    status: number;
    expectedIds?: number[];
  }[] = [
    {
      name: "saves the order and returns 200",
      body: { ids: [3, "1", 2] },
      result: () => Promise.resolve([]),
      status: 200,
      expectedIds: [3, 1, 2],
    },
    {
      name: "mismatching ids → 400",
      body: { ids: [1] },
      result: () => Promise.reject(new ValidationError("mismatch")),
      status: 400,
      expectedIds: [1],
    },
    { name: "empty ids → 400", body: { ids: [] }, status: 400 },
    { name: "non-numeric id → 400", body: { ids: ["x"] }, status: 400 },
    { name: "missing ids → 400", body: {}, status: 400 },
    { name: "invalid JSON → 400", body: "nope", status: 400 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.reorderCategories.mockImplementation(tt.result);
      const response = await PUT(makeRequest("PUT", tt.body), undefined);
      expect(response.status).toBe(tt.status);
      if (tt.expectedIds) expect(serviceMock.reorderCategories).toHaveBeenCalledWith(tt.expectedIds);
      else expect(serviceMock.reorderCategories).not.toHaveBeenCalled();
    });
  }
});
