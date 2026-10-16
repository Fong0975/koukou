// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";
import { makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({
  serviceMock: { listSubscriptions: vi.fn(), createSubscription: vi.fn() },
}));

vi.mock("@/services/subscriptionService", () => serviceMock);

import { GET, POST } from "./route";

const validBody = {
  name: "Netflix",
  categoryId: 1,
  paymentMethodId: 2,
  amount: 390,
  schedules: [{ cycle: "MONTHLY", dayOfMonth: 1 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/subscriptions", () => {
  const tests: { name: string; result: () => Promise<unknown>; status: number; body: unknown }[] = [
    { name: "returns the list", result: () => Promise.resolve([{ id: 1 }]), status: 200, body: { data: [{ id: 1 }] } },
    {
      name: "hides internal errors",
      result: () => Promise.reject(new Error("db down")),
      status: 500,
      body: { error: { code: "INTERNAL_ERROR", message: "伺服器發生錯誤，請稍後再試" } },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      serviceMock.listSubscriptions.mockImplementation(tt.result);
      const response = await GET(makeRequest("GET"), undefined);
      expect(response.status).toBe(tt.status);
      await expect(response.json()).resolves.toEqual(tt.body);
    });
  }
});

describe("POST /api/subscriptions", () => {
  const tests: {
    name: string;
    body: unknown;
    result?: () => Promise<unknown>;
    status: number;
    code?: string;
    serviceCalled: boolean;
  }[] = [
    {
      name: "creates and returns 201",
      body: validBody,
      result: () => Promise.resolve({ id: 1 }),
      status: 201,
      serviceCalled: true,
    },
    { name: "invalid JSON → 400", body: "{oops", status: 400, code: "VALIDATION_ERROR", serviceCalled: false },
    {
      name: "schema violation → 400",
      body: { ...validBody, amount: -1 },
      status: 400,
      code: "VALIDATION_ERROR",
      serviceCalled: false,
    },
    {
      name: "unknown category → 400",
      body: validBody,
      result: () => Promise.reject(new ValidationError("選擇的類型或扣款方式不存在")),
      status: 400,
      code: "VALIDATION_ERROR",
      serviceCalled: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.createSubscription.mockImplementation(tt.result);
      const response = await POST(makeRequest("POST", tt.body), undefined);
      const json = await response.json();

      expect(response.status).toBe(tt.status);
      expect(serviceMock.createSubscription).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
      if (tt.code) expect(json.error.code).toBe(tt.code);
      else {
        expect(json).toEqual({ data: { id: 1 } });
        expect(serviceMock.createSubscription).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Netflix", currency: "TWD", amount: 390 }),
        );
      }
    });
  }
});
