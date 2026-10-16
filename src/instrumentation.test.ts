// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { loggerMock } from "@/test/logger";

const { initializeDatabase } = vi.hoisted(() => ({ initializeDatabase: vi.fn() }));
vi.mock("@/services/dbInitService", () => ({ initializeDatabase }));
vi.mock("@/lib/logger", () => import("@/test/logger"));

import { register } from "./instrumentation";

describe("register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  const tests = [
    { name: "logs the start-up and prepares the database on the Node.js runtime", runtime: "nodejs", expectedCalls: 1 },
    { name: "skips the Edge runtime", runtime: "edge", expectedCalls: 0 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      vi.stubEnv("NEXT_RUNTIME", tt.runtime);
      vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "1.2.3");

      await register();

      expect(initializeDatabase).toHaveBeenCalledTimes(tt.expectedCalls);
      expect(loggerMock.info).toHaveBeenCalledTimes(tt.expectedCalls);
      if (tt.expectedCalls > 0) {
        expect(loggerMock.info).toHaveBeenCalledWith("Server starting", expect.objectContaining({ version: "1.2.3" }));
      }
    });
  }
});
