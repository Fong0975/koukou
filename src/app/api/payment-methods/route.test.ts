// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/lib/errors";
import { makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({
  serviceMock: { listPaymentMethods: vi.fn(), createPaymentMethod: vi.fn() },
}));

vi.mock("@/services/paymentMethodService", () => serviceMock);

import { GET, POST } from "./route";

const validBody = { type: "CREDIT_CARD", name: "國泰 CUBE" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/payment-methods", () => {
  const tests: { name: string; result: () => Promise<unknown>; status: number }[] = [
    { name: "returns the list", result: () => Promise.resolve([{ id: 1, ...validBody }]), status: 200 },
    { name: "DB failure → 500", result: () => Promise.reject(new Error("db down")), status: 500 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      serviceMock.listPaymentMethods.mockImplementation(tt.result);
      const response = await GET(makeRequest("GET"), undefined);
      expect(response.status).toBe(tt.status);
    });
  }
});

describe("POST /api/payment-methods", () => {
  const tests: {
    name: string;
    body: unknown;
    result?: () => Promise<unknown>;
    status: number;
    serviceCalled: boolean;
  }[] = [
    {
      name: "creates and returns 201",
      body: validBody,
      result: () => Promise.resolve({ id: 1 }),
      status: 201,
      serviceCalled: true,
    },
    {
      name: "duplicate → 409",
      body: validBody,
      result: () => Promise.reject(new ConflictError("dup")),
      status: 409,
      serviceCalled: true,
    },
    { name: "unknown type → 400", body: { ...validBody, type: "CASH" }, status: 400, serviceCalled: false },
    { name: "invalid JSON → 400", body: "nope", status: 400, serviceCalled: false },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.createPaymentMethod.mockImplementation(tt.result);
      const response = await POST(makeRequest("POST", tt.body), undefined);
      expect(response.status).toBe(tt.status);
      expect(serviceMock.createPaymentMethod).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
    });
  }
});
