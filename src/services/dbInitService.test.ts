// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { runMigrations, seedDefaults } = vi.hoisted(() => ({ runMigrations: vi.fn(), seedDefaults: vi.fn() }));
vi.mock("@/services/migrationService", () => ({ runMigrations }));
vi.mock("@/services/seedService", () => ({ seedDefaults }));

import { initializeDatabase } from "./dbInitService";

describe("initializeDatabase", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const ok = () => Promise.resolve();
  const fail = (message: string) => () => Promise.reject(new Error(message));

  const tests = [
    {
      name: "runs migrations then seed and succeeds",
      migrate: ok,
      seed: ok,
      expected: true,
      seedCalled: true,
      errorLogged: false,
    },
    {
      name: "skips seeding when migrations fail",
      migrate: fail("migrate failed"),
      seed: ok,
      expected: false,
      seedCalled: false,
      errorLogged: true,
    },
    {
      name: "reports failure when seeding fails",
      migrate: ok,
      seed: fail("seed failed"),
      expected: false,
      seedCalled: true,
      errorLogged: true,
    },
    {
      name: "uses the real services and the shared logger when no deps are given",
      migrate: ok,
      seed: ok,
      expected: true,
      seedCalled: true,
      errorLogged: false,
      defaultDeps: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      runMigrations.mockImplementation(tt.migrate);
      seedDefaults.mockImplementation(tt.seed);
      const logger = tt.defaultDeps
        ? {
            info: vi.spyOn(console, "info").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
          }
        : { info: vi.fn(), error: vi.fn() };

      const result = await initializeDatabase(tt.defaultDeps ? undefined : { runMigrations, seedDefaults, logger });

      expect(result).toBe(tt.expected);
      expect(runMigrations).toHaveBeenCalledTimes(1);
      expect(seedDefaults).toHaveBeenCalledTimes(tt.seedCalled ? 1 : 0);
      expect(logger.error).toHaveBeenCalledTimes(tt.errorLogged ? 1 : 0);
      if (tt.errorLogged) expect(logger.error).toHaveBeenCalledWith(expect.any(String), undefined, expect.any(Error));
    });
  }
});
