import { createLogger, type Logger } from "@/lib/logger";

/** Collaborators of {@link initializeDatabase}, injectable for testing. */
export interface DbInitDeps {
  runMigrations: () => Promise<unknown>;
  seedDefaults: () => Promise<unknown>;
  logger: Pick<Logger, "info" | "error">;
}

/**
 * Loads the real collaborators lazily so importing this module never pulls in
 * the Prisma client or child_process until initialization actually runs.
 */
async function loadDefaultDeps(): Promise<DbInitDeps> {
  const [{ runMigrations }, { seedDefaults }] = await Promise.all([
    import("@/services/migrationService"),
    import("@/services/seedService"),
  ]);
  return { runMigrations: () => runMigrations(), seedDefaults: () => seedDefaults(), logger: createLogger("dbInit") };
}

/**
 * Brings the database up to date on start-up: applies pending migrations, then seeds
 * default data. Failures are logged rather than thrown so the web server still starts
 * and can surface the problem.
 *
 * @param deps - Optional collaborators; real implementations are used when omitted.
 * @returns true when both steps succeed, otherwise false.
 */
export async function initializeDatabase(deps?: DbInitDeps): Promise<boolean> {
  const { runMigrations, seedDefaults, logger } = deps ?? (await loadDefaultDeps());

  try {
    await runMigrations();
    logger.info("Database migrations applied");
  } catch (error) {
    logger.error("Failed to apply database migrations", undefined, error);
    return false;
  }

  try {
    await seedDefaults();
    logger.info("Default data seeded");
  } catch (error) {
    logger.error("Failed to seed default data", undefined, error);
    return false;
  }

  return true;
}
