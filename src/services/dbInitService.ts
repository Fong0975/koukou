/** Collaborators of {@link initializeDatabase}, injectable for testing. */
export interface DbInitDeps {
  runMigrations: () => Promise<unknown>;
  seedDefaults: () => Promise<unknown>;
  logger: Pick<Console, "info" | "error">;
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
  return { runMigrations: () => runMigrations(), seedDefaults: () => seedDefaults(), logger: console };
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
    logger.info("[koukou] Database migrations applied.");
  } catch (error) {
    logger.error("[koukou] Failed to apply database migrations:", error);
    return false;
  }

  try {
    await seedDefaults();
    logger.info("[koukou] Default data seeded.");
  } catch (error) {
    logger.error("[koukou] Failed to seed default data:", error);
    return false;
  }

  return true;
}
