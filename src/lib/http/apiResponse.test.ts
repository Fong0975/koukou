// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { jsonData, jsonError, toErrorResponse, withErrorHandling } from "./apiResponse";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("jsonData", () => {
  const tests = [
    { name: "defaults to 200", data: [1, 2], status: undefined, expectedStatus: 200 },
    { name: "uses given status", data: { id: 1 }, status: 201, expectedStatus: 201 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const response = jsonData(tt.data, tt.status);
      expect(response.status).toBe(tt.expectedStatus);
      await expect(response.json()).resolves.toEqual({ data: tt.data });
    });
  }
});

describe("jsonError", () => {
  const tests = [
    {
      name: "omits details when absent",
      args: [404, "NOT_FOUND", "nf"] as const,
      expected: { error: { code: "NOT_FOUND", message: "nf" } },
    },
    {
      name: "includes details",
      args: [400, "VALIDATION_ERROR", "bad", [{ path: "name", message: "bad" }]] as const,
      expected: { error: { code: "VALIDATION_ERROR", message: "bad", details: [{ path: "name", message: "bad" }] } },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const [status, code, message, details] = tt.args;
      const response = jsonError(status, code, message, details ? [...details] : undefined);
      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toEqual(tt.expected);
    });
  }
});

describe("toErrorResponse", () => {
  const zodError = z.object({ name: z.string().min(1, "請輸入名稱") }).safeParse({ name: "" }).error;

  const tests: {
    name: string;
    error: unknown;
    status: number;
    code: string;
    message: string;
    details?: unknown;
    logged: boolean;
  }[] = [
    {
      name: "ZodError → 400 with every issue as details",
      error: zodError,
      status: 400,
      code: "VALIDATION_ERROR",
      message: "請輸入名稱",
      details: [{ path: "name", message: "請輸入名稱" }],
      logged: false,
    },
    {
      name: "ValidationError → 400",
      error: new ValidationError("bad"),
      status: 400,
      code: "VALIDATION_ERROR",
      message: "bad",
      logged: false,
    },
    {
      name: "NotFoundError → 404",
      error: new NotFoundError("nf"),
      status: 404,
      code: "NOT_FOUND",
      message: "nf",
      logged: false,
    },
    {
      name: "ConflictError → 409",
      error: new ConflictError("dup"),
      status: 409,
      code: "CONFLICT",
      message: "dup",
      logged: false,
    },
    {
      name: "unknown Error → 500 without leaking",
      error: new Error("secret"),
      status: 500,
      code: "INTERNAL_ERROR",
      message: "伺服器發生錯誤，請稍後再試",
      logged: true,
    },
    {
      name: "non-Error value → 500",
      error: "oops",
      status: 500,
      code: "INTERNAL_ERROR",
      message: "伺服器發生錯誤，請稍後再試",
      logged: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const response = toErrorResponse(tt.error);
      const body = await response.json();
      expect(response.status).toBe(tt.status);
      expect(body.error.code).toBe(tt.code);
      expect(body.error.message).toBe(tt.message);
      expect(body.error.details).toEqual(tt.details);
      expect(console.error).toHaveBeenCalledTimes(tt.logged ? 1 : 0);
    });
  }
});

describe("withErrorHandling", () => {
  const request = new Request("http://localhost/api/test");

  const tests: { name: string; handler: () => Promise<Response>; expectedStatus: number }[] = [
    { name: "passes through successful responses", handler: async () => jsonData("ok"), expectedStatus: 200 },
    {
      name: "converts thrown domain errors",
      handler: async () => {
        throw new NotFoundError("nf");
      },
      expectedStatus: 404,
    },
    {
      name: "converts unexpected errors",
      handler: async () => {
        throw new Error("boom");
      },
      expectedStatus: 500,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const wrapped = withErrorHandling(tt.handler);
      const response = await wrapped(request, undefined);
      expect(response.status).toBe(tt.expectedStatus);
    });
  }
});
