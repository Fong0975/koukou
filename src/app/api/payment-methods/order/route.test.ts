// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";
import { makeRequest } from "@/test/requests";

const { serviceMock } = vi.hoisted(() => ({ serviceMock: { reorderPaymentMethods: vi.fn() } }));

vi.mock("@/services/paymentMethodService", () => serviceMock);

import { PUT } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PUT /api/payment-methods/order", () => {
  const tests: {
    name: string;
    body: unknown;
    result?: () => Promise<unknown>;
    status: number;
    expectedIds?: number[];
  }[] = [
    {
      name: "saves the order and returns 200",
      body: { ids: [4, "3", 5] },
      result: () => Promise.resolve([]),
      status: 200,
      expectedIds: [4, 3, 5],
    },
    {
      name: "mismatching ids → 400",
      body: { ids: [3] },
      result: () => Promise.reject(new ValidationError("mismatch")),
      status: 400,
      expectedIds: [3],
    },
    { name: "empty ids → 400", body: { ids: [] }, status: 400 },
    { name: "non-numeric id → 400", body: { ids: ["x"] }, status: 400 },
    { name: "missing ids → 400", body: {}, status: 400 },
    { name: "invalid JSON → 400", body: "nope", status: 400 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.reorderPaymentMethods.mockImplementation(tt.result);
      const response = await PUT(makeRequest("PUT", tt.body), undefined);
      expect(response.status).toBe(tt.status);
      if (tt.expectedIds) expect(serviceMock.reorderPaymentMethods).toHaveBeenCalledWith(tt.expectedIds);
      else expect(serviceMock.reorderPaymentMethods).not.toHaveBeenCalled();
    });
  }
});
