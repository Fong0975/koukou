// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { runMigrations } = vi.hoisted(() => ({ runMigrations: vi.fn() }));
vi.mock("@/services/migrationService", () => ({ runMigrations }));

import { initializeDatabase } from "./dbInitService";

describe("initializeDatabase", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const ok = () => Promise.resolve();
  const fail = (message: string) => () => Promise.reject(new Error(message));

  const tests = [
    { name: "applies migrations and succeeds", migrate: ok, expected: true, errorLogged: false },
    {
      name: "reports failure when migrations fail",
      migrate: fail("migrate failed"),
      expected: false,
      errorLogged: true,
    },
    {
      name: "uses the real service and the shared logger when no deps are given",
      migrate: ok,
      expected: true,
      errorLogged: false,
      defaultDeps: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      runMigrations.mockImplementation(tt.migrate);
      const logger = tt.defaultDeps
        ? {
            info: vi.spyOn(console, "info").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
          }
        : { info: vi.fn(), error: vi.fn() };

      const result = await initializeDatabase(tt.defaultDeps ? undefined : { runMigrations, logger });

      expect(result).toBe(tt.expected);
      expect(runMigrations).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledTimes(tt.errorLogged ? 1 : 0);
      if (tt.errorLogged) expect(logger.error).toHaveBeenCalledWith(expect.any(String), undefined, expect.any(Error));
    });
  }
});
