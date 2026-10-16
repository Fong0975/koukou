// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { serviceMock } = vi.hoisted(() => ({ serviceMock: { checkDatabase: vi.fn() } }));

vi.mock("@/services/healthService", () => serviceMock);
vi.mock("@/lib/logger", () => import("@/test/logger"));

import { loggerMock } from "@/test/logger";
import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  const dbError = new Error("db down");
  const tests: { name: string; result: () => Promise<void>; status: number; body: unknown; warned: boolean }[] = [
    {
      name: "database reachable → 200 with version",
      result: () => Promise.resolve(),
      status: 200,
      body: { data: { status: "ok", version: "9.9.9" } },
      warned: false,
    },
    {
      name: "database unreachable → 503 and a warning",
      result: () => Promise.reject(dbError),
      status: 503,
      body: { error: { code: "SERVICE_UNAVAILABLE", message: "資料庫無法連線" } },
      warned: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "9.9.9");
      serviceMock.checkDatabase.mockImplementation(tt.result);

      const response = await GET();

      expect(response.status).toBe(tt.status);
      await expect(response.json()).resolves.toEqual(tt.body);
      if (tt.warned) expect(loggerMock.warn).toHaveBeenCalledWith("Health check failed", undefined, dbError);
      else expect(loggerMock.warn).not.toHaveBeenCalled();
    });
  }
});
