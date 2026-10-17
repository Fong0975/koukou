// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ConflictError, NotFoundError, UpstreamError, ValidationError } from "@/lib/errors";
import { type ApiError, jsonData, jsonError, toApiError, withErrorHandling } from "./apiResponse";

const { logRequest } = vi.hoisted(() => ({ logRequest: vi.fn() }));
vi.mock("./requestLog", () => ({ logRequest }));

afterEach(() => {
  vi.clearAllMocks();
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

describe("toApiError", () => {
  const zodError = z.object({ name: z.string().min(1, "請輸入名稱") }).safeParse({ name: "" }).error;
  const internal: ApiError = { status: 500, code: "INTERNAL_ERROR", message: "伺服器發生錯誤，請稍後再試" };

  const tests: { name: string; error: unknown; expected: ApiError }[] = [
    {
      name: "ZodError → 400 with every issue as details",
      error: zodError,
      expected: {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "請輸入名稱",
        details: [{ path: "name", message: "請輸入名稱" }],
      },
    },
    {
      name: "ValidationError → 400",
      error: new ValidationError("bad"),
      expected: { status: 400, code: "VALIDATION_ERROR", message: "bad" },
    },
    {
      name: "NotFoundError → 404",
      error: new NotFoundError("nf"),
      expected: { status: 404, code: "NOT_FOUND", message: "nf" },
    },
    {
      name: "ConflictError → 409",
      error: new ConflictError("dup"),
      expected: { status: 409, code: "CONFLICT", message: "dup" },
    },
    {
      name: "UpstreamError → 502",
      error: new UpstreamError("down"),
      expected: { status: 502, code: "UPSTREAM_ERROR", message: "down" },
    },
    { name: "unknown Error → 500 without leaking", error: new Error("secret"), expected: internal },
    { name: "non-Error value → 500", error: "oops", expected: internal },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(toApiError(tt.error)).toEqual(tt.expected);
    });
  }
});

describe("withErrorHandling", () => {
  const request = new Request("http://localhost/api/test");
  const notFound = new NotFoundError("nf");
  const boom = new Error("boom");

  const tests: {
    name: string;
    handler: () => Promise<Response>;
    expectedStatus: number;
    expectedBody?: unknown;
    expectedLog: Record<string, unknown>;
  }[] = [
    {
      name: "passes through successful responses",
      handler: async () => jsonData("ok"),
      expectedStatus: 200,
      expectedBody: { data: "ok" },
      expectedLog: { status: 200 },
    },
    {
      name: "converts thrown domain errors",
      handler: async () => {
        throw notFound;
      },
      expectedStatus: 404,
      expectedBody: { error: { code: "NOT_FOUND", message: "nf" } },
      expectedLog: { status: 404, code: "NOT_FOUND", reason: "nf", error: notFound },
    },
    {
      name: "converts unexpected errors",
      handler: async () => {
        throw boom;
      },
      expectedStatus: 500,
      expectedBody: { error: { code: "INTERNAL_ERROR", message: "伺服器發生錯誤，請稍後再試" } },
      expectedLog: { status: 500, code: "INTERNAL_ERROR", error: boom },
    },
    {
      name: "logs bodiless responses",
      handler: async () => new Response(null, { status: 204 }),
      expectedStatus: 204,
      expectedLog: { status: 204 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const wrapped = withErrorHandling(tt.handler);
      const response = await wrapped(request, undefined);

      expect(response.status).toBe(tt.expectedStatus);
      if (tt.expectedBody !== undefined) await expect(response.json()).resolves.toEqual(tt.expectedBody);
      expect(logRequest).toHaveBeenCalledTimes(1);
      expect(logRequest).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ ...tt.expectedLog, durationMs: expect.any(Number) }),
      );
    });
  }
});
