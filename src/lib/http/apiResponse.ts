import { ZodError } from "zod";
import { AppError, ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

/** A single field-level validation problem. */
export interface ApiErrorDetail {
  path: string;
  message: string;
}

/** Error envelope returned by every API endpoint. */
export interface ApiErrorBody {
  error: { code: string; message: string; details?: ApiErrorDetail[] };
}

/** Success envelope returned by every API endpoint that has a body. */
export interface ApiSuccessBody<T> {
  data: T;
}

/**
 * Builds a JSON success response.
 *
 * @param data - Payload placed under `data`.
 * @param status - HTTP status, 200 by default.
 */
export function jsonData<T>(data: T, status = 200): Response {
  return Response.json({ data } satisfies ApiSuccessBody<T>, { status });
}

/**
 * Builds a JSON error response.
 *
 * @param status - HTTP status.
 * @param code - Machine-readable error code.
 * @param message - Human-readable message.
 * @param details - Optional field-level problems.
 */
export function jsonError(status: number, code: string, message: string, details?: ApiErrorDetail[]): Response {
  return Response.json({ error: { code, message, ...(details && { details }) } } satisfies ApiErrorBody, { status });
}

const STATUS_BY_ERROR = new Map<abstract new (...args: never[]) => AppError, number>([
  [ValidationError, 400],
  [NotFoundError, 404],
  [ConflictError, 409],
]);

/**
 * Converts any thrown value into an error response. Unknown errors become a
 * generic 500 so internal details never leak to clients.
 *
 * @param error - The caught value.
 */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    return jsonError(400, "VALIDATION_ERROR", details[0]?.message ?? "資料格式錯誤", details);
  }
  if (error instanceof AppError) {
    for (const [ErrorType, status] of STATUS_BY_ERROR) {
      if (error instanceof ErrorType) return jsonError(status, error.code, error.message);
    }
  }
  console.error("[koukou] Unhandled API error:", error);
  return jsonError(500, "INTERNAL_ERROR", "伺服器發生錯誤，請稍後再試");
}

/**
 * Wraps a route handler so thrown errors are turned into JSON error responses.
 *
 * @param handler - The route handler.
 * @returns A handler with the same signature that never throws.
 */
export function withErrorHandling<C>(
  handler: (request: Request, context: C) => Promise<Response>,
): (request: Request, context: C) => Promise<Response> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
