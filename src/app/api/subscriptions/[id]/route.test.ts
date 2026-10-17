// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";
import { idContext, makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({
  serviceMock: { getSubscription: vi.fn(), updateSubscription: vi.fn(), deleteSubscription: vi.fn() },
}));

vi.mock("@/services/subscriptionService", () => serviceMock);

import { DELETE, GET, PUT } from "./route";

const validBody = {
  name: "Netflix",
  categoryId: 1,
  paymentMethodId: 2,
  amount: 390,
  startDate: "2026-01-01",
  schedules: [{ cycle: "MONTHLY", dayOfMonth: 1 }],
};

const notFound = () => Promise.reject(new NotFoundError("找不到扣款項目 #9"));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/subscriptions/:id", () => {
  const tests: { name: string; id: string; result?: () => Promise<unknown>; status: number; calledWith?: number }[] = [
    { name: "returns the subscription", id: "1", result: () => Promise.resolve({ id: 1 }), status: 200, calledWith: 1 },
    { name: "missing → 404", id: "9", result: notFound, status: 404, calledWith: 9 },
    { name: "malformed id → 404 without calling service", id: "abc", status: 404 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.getSubscription.mockImplementation(tt.result);
      const response = await GET(makeRequest("GET"), idContext(tt.id));
      expect(response.status).toBe(tt.status);
      if (tt.calledWith) expect(serviceMock.getSubscription).toHaveBeenCalledWith(tt.calledWith);
      else expect(serviceMock.getSubscription).not.toHaveBeenCalled();
    });
  }
});

describe("PUT /api/subscriptions/:id", () => {
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
      id: "1",
      body: validBody,
      result: () => Promise.resolve({ id: 1 }),
      status: 200,
      serviceCalled: true,
    },
    { name: "missing → 404", id: "9", body: validBody, result: notFound, status: 404, serviceCalled: true },
    { name: "invalid body → 400", id: "1", body: { ...validBody, schedules: [] }, status: 400, serviceCalled: false },
    { name: "malformed id → 404", id: "0", body: validBody, status: 404, serviceCalled: false },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.updateSubscription.mockImplementation(tt.result);
      const response = await PUT(makeRequest("PUT", tt.body), idContext(tt.id));
      expect(response.status).toBe(tt.status);
      expect(serviceMock.updateSubscription).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
      if (tt.serviceCalled) {
        expect(serviceMock.updateSubscription).toHaveBeenCalledWith(
          Number(tt.id),
          expect.objectContaining({ name: "Netflix" }),
        );
      }
    });
  }
});

describe("DELETE /api/subscriptions/:id", () => {
  const tests: { name: string; id: string; result?: () => Promise<unknown>; status: number; serviceCalled: boolean }[] =
    [
      { name: "deletes and returns 204", id: "1", result: () => Promise.resolve(), status: 204, serviceCalled: true },
      { name: "missing → 404", id: "9", result: notFound, status: 404, serviceCalled: true },
      { name: "malformed id → 404", id: "-1", status: 404, serviceCalled: false },
    ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.deleteSubscription.mockImplementation(tt.result);
      const response = await DELETE(makeRequest("DELETE"), idContext(tt.id));
      expect(response.status).toBe(tt.status);
      expect(serviceMock.deleteSubscription).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
      if (tt.status === 204) expect(await response.text()).toBe("");
    });
  }
});
