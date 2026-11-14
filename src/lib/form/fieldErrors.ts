/** Error messages keyed by dotted field path, e.g. "schedules.0.dayOfMonth". */
export type FieldErrors = Record<string, string>;

/**
 * Collapses validation issues (from zod or the API error `details`) into one
 * message per field, keeping the first message for each path.
 *
 * @param issues - Issues whose path is either an array or a dotted string.
 */
export function toFieldErrors(
  issues: readonly { path: readonly PropertyKey[] | string; message: string }[],
): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const path = typeof issue.path === "string" ? issue.path : issue.path.map(String).join(".");
    errors[path] ??= issue.message;
  }
  return errors;
}

/**
 * Finds the error of a field or of anything nested under it, e.g. "reminders.chargeDaysBefore"
 * also matches "reminders.chargeDaysBefore.0".
 *
 * @param errors - Field errors keyed by dotted path.
 * @param path - The field's dotted path.
 * @returns The field's own message, else the first nested one, else undefined.
 */
export function errorUnder(errors: FieldErrors, path: string): string | undefined {
  return errors[path] ?? Object.entries(errors).find(([key]) => key.startsWith(`${path}.`))?.[1];
}
