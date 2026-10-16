/**
 * Next.js start-up hook. Runs once per server process and prepares the database
 * (migrations + seed). Skipped on the Edge runtime, which cannot spawn processes.
 */
export async function register(): Promise<void> {
  // Keep the import inside a positive NEXT_RUNTIME check: the bundler only strips
  // dead `if` branches, so an early return would still pull the DB driver into the Edge bundle.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeDatabase } = await import("@/services/dbInitService");
    await initializeDatabase();
  }
}
