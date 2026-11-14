import { createLogger, type Logger } from "@/lib/logger";

/** Collaborators of {@link initializeDatabase}, injectable for testing. */
interface DbInitDeps {
  runMigrations: () => Promise<unknown>;
  logger: Pick<Logger, "info" | "error">;
}

/**
 * Loads the real collaborators lazily so importing this module never pulls in
 * child_process until initialization actually runs.
 */
async function loadDefaultDeps(): Promise<DbInitDeps> {
  const { runMigrations } = await import("@/services/migrationService");
  return { runMigrations: () => runMigrations(), logger: createLogger("dbInitService") };
}

/**
 * Brings the database up to date on start-up by applying pending migrations. Default data
 * is inserted by migrations too, so it is created once and never restored after deletion.
 * Failures are logged rather than thrown so the web server still starts and can surface the problem.
 *
 * @param deps - Optional collaborators; real implementations are used when omitted.
 * @returns true when the migrations succeed, otherwise false.
 */
export async function initializeDatabase(deps?: DbInitDeps): Promise<boolean> {
  const { runMigrations, logger } = deps ?? (await loadDefaultDeps());

  try {
    await runMigrations();
    logger.info("Database migrations applied");
    return true;
  } catch (error) {
    logger.error("Failed to apply database migrations", undefined, error);
    return false;
  }
}
