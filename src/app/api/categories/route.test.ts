// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/lib/errors";
import { makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({
  serviceMock: { listCategories: vi.fn(), createCategory: vi.fn() },
}));

vi.mock("@/services/categoryService", () => serviceMock);

import { GET, POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/categories", () => {
  const tests: { name: string; result: () => Promise<unknown>; status: number }[] = [
    { name: "returns the list", result: () => Promise.resolve([{ id: 1, name: "網站會員" }]), status: 200 },
    { name: "DB failure → 500", result: () => Promise.reject(new Error("db down")), status: 500 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      serviceMock.listCategories.mockImplementation(tt.result);
      const response = await GET(makeRequest("GET"), undefined);
      expect(response.status).toBe(tt.status);
    });
  }
});

describe("POST /api/categories", () => {
  const tests: {
    name: string;
    body: unknown;
    result?: () => Promise<unknown>;
    status: number;
    serviceCalled: boolean;
  }[] = [
    {
      name: "creates and returns 201",
      body: { name: "健身房" },
      result: () => Promise.resolve({ id: 9 }),
      status: 201,
      serviceCalled: true,
    },
    {
      name: "duplicate → 409",
      body: { name: "其他" },
      result: () => Promise.reject(new ConflictError("dup")),
      status: 409,
      serviceCalled: true,
    },
    { name: "blank name → 400", body: { name: " " }, status: 400, serviceCalled: false },
    { name: "invalid JSON → 400", body: "nope", status: 400, serviceCalled: false },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.createCategory.mockImplementation(tt.result);
      const response = await POST(makeRequest("POST", tt.body), undefined);
      expect(response.status).toBe(tt.status);
      expect(serviceMock.createCategory).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
    });
  }
});
