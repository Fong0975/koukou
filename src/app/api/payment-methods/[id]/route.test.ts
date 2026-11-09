// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { idContext, makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({
  serviceMock: { updatePaymentMethod: vi.fn(), deletePaymentMethod: vi.fn() },
}));

vi.mock("@/services/paymentMethodService", () => serviceMock);

import { DELETE, PUT } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PUT /api/payment-methods/:id", () => {
  const body = { type: "BANK_ACCOUNT", name: "台新 Richart", note: "薪轉" };
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
      id: "7",
      body,
      result: () => Promise.resolve({ id: 7 }),
      status: 200,
      serviceCalled: true,
    },
    {
      name: "missing → 404",
      id: "7",
      body,
      result: () => Promise.reject(new NotFoundError("missing")),
      status: 404,
      serviceCalled: true,
    },
    {
      name: "duplicate → 409",
      id: "7",
      body,
      result: () => Promise.reject(new ConflictError("dup")),
      status: 409,
      serviceCalled: true,
    },
    { name: "blank name → 400", id: "7", body: { ...body, name: " " }, status: 400, serviceCalled: false },
    { name: "unknown type → 400", id: "7", body: { ...body, type: "CASH" }, status: 400, serviceCalled: false },
    { name: "invalid id → 404", id: "abc", body, status: 404, serviceCalled: false },
    { name: "invalid JSON → 400", id: "7", body: "nope", status: 400, serviceCalled: false },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.updatePaymentMethod.mockImplementation(tt.result);
      const response = await PUT(makeRequest("PUT", tt.body), idContext(tt.id));
      expect(response.status).toBe(tt.status);
      expect(serviceMock.updatePaymentMethod).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
      if (tt.serviceCalled) expect(serviceMock.updatePaymentMethod).toHaveBeenCalledWith(7, expect.any(Object));
    });
  }
});

describe("DELETE /api/payment-methods/:id", () => {
  const tests: {
    name: string;
    id: string;
    result?: () => Promise<unknown>;
    status: number;
    serviceCalled: boolean;
  }[] = [
    { name: "deletes and returns 204", id: "7", result: () => Promise.resolve(), status: 204, serviceCalled: true },
    {
      name: "missing → 404",
      id: "7",
      result: () => Promise.reject(new NotFoundError("missing")),
      status: 404,
      serviceCalled: true,
    },
    {
      name: "in use → 400",
      id: "7",
      result: () => Promise.reject(new ValidationError("in use")),
      status: 400,
      serviceCalled: true,
    },
    { name: "invalid id → 404", id: "abc", status: 404, serviceCalled: false },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.deletePaymentMethod.mockImplementation(tt.result);
      const response = await DELETE(makeRequest("DELETE"), idContext(tt.id));
      expect(response.status).toBe(tt.status);
      expect(serviceMock.deletePaymentMethod).toHaveBeenCalledTimes(tt.serviceCalled ? 1 : 0);
    });
  }
});
