// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { loggerMock as logger } from "@/test/logger";

vi.mock("@/lib/logger", () => import("@/test/logger"));

import { clientIp, logRequest, type RequestOutcome } from "./requestLog";

afterEach(() => {
  vi.clearAllMocks();
});

describe("clientIp", () => {
  const tests: { name: string; headers: Record<string, string>; expected: string }[] = [
    {
      name: "first forwarded address",
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
      expected: "203.0.113.5",
    },
    { name: "falls back to x-real-ip", headers: { "x-real-ip": " 198.51.100.7 " }, expected: "198.51.100.7" },
    {
      name: "forwarded wins over x-real-ip",
      headers: { "x-forwarded-for": "::1", "x-real-ip": "198.51.100.7" },
      expected: "::1",
    },
    {
      name: "empty forwarded header falls back",
      headers: { "x-forwarded-for": " ", "x-real-ip": "::1" },
      expected: "::1",
    },
    { name: "unknown without headers", headers: {}, expected: "-" },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(clientIp(new Request("http://localhost/api/test", { headers: tt.headers }))).toBe(tt.expected);
    });
  }
});

describe("logRequest", () => {
  const request = new Request("http://localhost/api/subscriptions/5?secret=1", {
    method: "PUT",
    headers: { "x-forwarded-for": "::1" },
  });
  const base = { method: "PUT", path: "/api/subscriptions/5", duration_ms: 13, client_ip: "::1" };
  const boom = new Error("boom");

  const tests: {
    name: string;
    outcome: RequestOutcome;
    expectedLevel: "info" | "warn" | "error";
    expectedArgs: unknown[];
  }[] = [
    {
      name: "success is INFO",
      outcome: { status: 200, durationMs: 12.6 },
      expectedLevel: "info",
      expectedArgs: ["Request processed", { ...base, status: 200, code: undefined }],
    },
    {
      name: "client error is WARN with the reason",
      outcome: { status: 404, durationMs: 12.6, code: "NOT_FOUND", reason: "找不到", error: new Error("nf") },
      expectedLevel: "warn",
      expectedArgs: ["Request rejected", { ...base, status: 404, code: "NOT_FOUND", reason: "找不到" }],
    },
    {
      name: "server error is ERROR with the thrown value",
      outcome: { status: 500, durationMs: 12.6, code: "INTERNAL_ERROR", reason: "伺服器發生錯誤", error: boom },
      expectedLevel: "error",
      expectedArgs: ["Request failed", { ...base, status: 500, code: "INTERNAL_ERROR" }, boom],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      logRequest(request, tt.outcome);

      for (const level of ["debug", "info", "warn", "error"] as const) {
        if (level === tt.expectedLevel) expect(logger[level]).toHaveBeenCalledWith(...tt.expectedArgs);
        else expect(logger[level]).not.toHaveBeenCalled();
      }
    });
  }
});
