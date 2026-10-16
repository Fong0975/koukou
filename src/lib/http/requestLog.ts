import { createLogger } from "@/lib/logger";

const logger = createLogger("api");

/** What happened to one API request. */
export interface RequestOutcome {
  status: number;
  durationMs: number;
  /** Machine-readable error code of a failed request. */
  code?: string;
  /** User-facing reason; logged for rejected (4xx) requests only. */
  reason?: string;
  /** The value thrown by the handler; logged with its stack for server errors (5xx) only. */
  error?: unknown;
}

/**
 * Finds the client's IP address. Route handlers cannot see the socket, so this relies on the
 * forwarding headers set by Next.js or a reverse proxy.
 *
 * @param request - Incoming request.
 * @returns The first `x-forwarded-for` entry, else `x-real-ip`, else `-`.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "-";
}

/**
 * Writes one access record: INFO for success, WARN for client errors (4xx), ERROR for server
 * errors (5xx). Only the path is logged, never the query string or body.
 *
 * @param request - Incoming request.
 * @param outcome - Status, timing and failure details.
 */
export function logRequest(request: Request, { status, durationMs, code, reason, error }: RequestOutcome): void {
  const context = {
    method: request.method,
    path: new URL(request.url).pathname,
    status,
    code,
    duration_ms: Math.round(durationMs),
    client_ip: clientIp(request),
  };

  if (status >= 500) logger.error("Request failed", context, error);
  else if (status >= 400) logger.warn("Request rejected", { ...context, reason });
  else logger.info("Request processed", context);
}
