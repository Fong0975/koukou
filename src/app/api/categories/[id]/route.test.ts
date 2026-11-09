// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { idContext, makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({
  serviceMock: { updateCategory: vi.fn(), deleteCategory: vi.fn() },
}));

vi.mock("@/services/categoryService", () => serviceMock);

import { DELETE, PUT } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PUT /api/categories/:id", () => {
  const tests: {
    name: string;
    id: string;
    body: unknown;
    result?: () => Promise<unknown>;
    status: number;
    serviceCalled: boolean;
  }[] = [
    {
      name: "updates and returns 200",
      id: "9",
      body: { name: "健身房", icon: "💪" },
      result: () => Promise.resolve({ id: 9 }),
      status: 200,
      serviceCalled: true,
    },
    {
      name: "missing → 404",
      id: "9",
      body: { name: "健身房" },
      result: () => Promise.reject(new NotFoundError("missing")),
      status: 404,
      serviceCalled: true,
    },
    {
      name: "duplicate → 409",
      id: "9",
      body: { name: "其他" },
      result: () => Promise.reject(new ConflictError("dup")),
      status: 409,
      serviceCalled: true,
    },
    { name: "blank name → 400", id: "9", body: { name: " " }, status: 400, serviceCalled: false },
    { name: "invalid id → 404", id: "abc", body: { name: "健身房" }, status: 404, serviceCalled: false },
    { name: "invalid JSON → 400", id: "9", body: "nope", status: 400, serviceCalled: false },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.updateCategory.mockImplementation(tt.result);
      const response = await PUT(makeRequest("PUT", tt.body), idContext(tt.id));
      expect(response.status).toBe(tt.status);
      expect(serviceMock.updateCategory).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
      if (tt.serviceCalled) expect(serviceMock.updateCategory).toHaveBeenCalledWith(9, expect.any(Object));
    });
  }
});

describe("DELETE /api/categories/:id", () => {
  const tests: {
    name: string;
    id: string;
    result?: () => Promise<unknown>;
    status: number;
    serviceCalled: boolean;
  }[] = [
    { name: "deletes and returns 204", id: "9", result: () => Promise.resolve(), status: 204, serviceCalled: true },
    {
      name: "missing → 404",
      id: "9",
      result: () => Promise.reject(new NotFoundError("missing")),
      status: 404,
      serviceCalled: true,
    },
    {
      name: "in use → 400",
      id: "9",
      result: () => Promise.reject(new ValidationError("in use")),
      status: 400,
      serviceCalled: true,
    },
    { name: "invalid id → 404", id: "abc", status: 404, serviceCalled: false },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.deleteCategory.mockImplementation(tt.result);
      const response = await DELETE(makeRequest("DELETE"), idContext(tt.id));
      expect(response.status).toBe(tt.status);
      expect(serviceMock.deleteCategory).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
    });
  }
});
