/** Log levels from least to most severe. */
export const LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Checks whether a string names a log level (case-sensitive).
 *
 * @param value - Candidate level name.
 */
export function isLogLevel(value: string): value is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value);
}

/**
 * Decides whether a record at `level` passes the configured `threshold`.
 *
 * @param level - Level of the record.
 * @param threshold - Lowest level that is output.
 * @returns true when `level` is at least as severe as `threshold`.
 */
export function isEnabled(level: LogLevel, threshold: LogLevel): boolean {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(threshold);
}
