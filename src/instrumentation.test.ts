// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { initializeDatabase } = vi.hoisted(() => ({ initializeDatabase: vi.fn() }));
vi.mock("@/services/dbInitService", () => ({ initializeDatabase }));

import { register } from "./instrumentation";

describe("register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  const tests = [
    { name: "prepares the database on the Node.js runtime", runtime: "nodejs", expectedCalls: 1 },
    { name: "skips the Edge runtime", runtime: "edge", expectedCalls: 0 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      vi.stubEnv("NEXT_RUNTIME", tt.runtime);

      await register();

      expect(initializeDatabase).toHaveBeenCalledTimes(tt.expectedCalls);
    });
  }
});
