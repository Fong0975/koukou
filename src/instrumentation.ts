/**
 * Next.js start-up hook. Runs once per server process, records the start-up and prepares the
 * database (migrations + seed). Skipped on the Edge runtime, which cannot spawn processes or write files.
 */
export async function register(): Promise<void> {
  // Keep the imports inside a positive NEXT_RUNTIME check: the bundler only strips dead `if`
  // branches, so an early return would still pull the DB driver and node:fs into the Edge bundle.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const [{ createLogger }, { initializeDatabase }] = await Promise.all([
      import("@/lib/logger"),
      import("@/services/dbInitService"),
    ]);
    createLogger("server").info("Server starting", {
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      node_env: process.env.NODE_ENV,
      pid: process.pid,
    });
    await initializeDatabase();
  }
}
