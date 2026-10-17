/** Base class for expected, user-facing domain errors. */
export abstract class AppError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The requested record does not exist. */
export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND";
}

/** The record conflicts with an existing one (e.g. duplicate name). */
export class ConflictError extends AppError {
  readonly code = "CONFLICT";
}

/** The input is invalid or references records that do not exist. */
export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
}

/** An external service the request depends on failed or answered unexpectedly. */
export class UpstreamError extends AppError {
  readonly code = "UPSTREAM_ERROR";
}
