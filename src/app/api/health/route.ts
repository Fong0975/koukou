import { jsonData, jsonError } from "@/lib/http/apiResponse";
import { createLogger } from "@/lib/logger";
import { checkDatabase } from "@/services/healthService";

const logger = createLogger("api/health");

/**
 * GET /api/health — reports whether the server and its database are up, for container health checks.
 * Not wrapped in `withErrorHandling` on purpose: the probe runs every few seconds and would flood
 * the access log, so only failures are logged.
 */
export async function GET(): Promise<Response> {
  try {
    await checkDatabase();
    return jsonData({ status: "ok", version: process.env.NEXT_PUBLIC_APP_VERSION });
  } catch (error) {
    logger.warn("Health check failed", undefined, error);
    return jsonError(503, "SERVICE_UNAVAILABLE", "資料庫無法連線");
  }
}
