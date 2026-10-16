import { ZodError } from "zod";
import { AppError, ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { logRequest } from "./requestLog";

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

/** How a thrown value is reported to the client. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

/**
 * Maps any thrown value to the error reported to the client. Unknown errors become a
 * generic 500 so internal details never leak to clients.
 *
 * @param error - The caught value.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    return { status: 400, code: "VALIDATION_ERROR", message: details[0]?.message ?? "資料格式錯誤", details };
  }
  if (error instanceof AppError) {
    for (const [ErrorType, status] of STATUS_BY_ERROR) {
      if (error instanceof ErrorType) return { status, code: error.code, message: error.message };
    }
  }
  return { status: 500, code: "INTERNAL_ERROR", message: "伺服器發生錯誤，請稍後再試" };
}

/**
 * Wraps a route handler so thrown errors are turned into JSON error responses and every
 * request is written to the access log.
 *
 * @param handler - The route handler.
 * @returns A handler with the same signature that never throws.
 */
export function withErrorHandling<C>(
  handler: (request: Request, context: C) => Promise<Response>,
): (request: Request, context: C) => Promise<Response> {
  return async (request, context) => {
    const startedAt = performance.now();
    try {
      const response = await handler(request, context);
      logRequest(request, { status: response.status, durationMs: performance.now() - startedAt });
      return response;
    } catch (error) {
      const { status, code, message, details } = toApiError(error);
      logRequest(request, { status, code, reason: message, error, durationMs: performance.now() - startedAt });
      return jsonError(status, code, message, details);
    }
  };
}
