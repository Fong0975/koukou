import { inspect } from "node:util";
import { LOG_LEVELS, type LogLevel } from "./levels";

/** Structured key/value pairs appended to a log message; undefined values are omitted. */
export type LogContext = Record<string, string | number | boolean | null | undefined>;

/** Everything needed to render one log record. */
export interface LogRecord {
  time: Date;
  level: LogLevel;
  /** Module that wrote the record, e.g. `subscriptionService`. */
  source: string;
  message: string;
  context?: LogContext;
  /** A caught value; rendered (with its stack for errors) on indented lines below the record. */
  error?: unknown;
}

const LEVEL_WIDTH = Math.max(...LOG_LEVELS.map((level) => level.length));

/** Values containing these characters are quoted so the `[k=v, k=v]` list stays unambiguous. */
const NEEDS_QUOTES = /[\s,=[\]"]/;

const pad = (value: number, width = 2) => String(value).padStart(width, "0");

/**
 * Formats a date as ISO 8601 in the server's local time zone, with milliseconds and the
 * UTC offset, e.g. `2026-08-29T12:54:38.286+08:00`.
 *
 * @param date - The moment to format.
 */
export function formatTimestamp(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}` +
    `${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`
  );
}

function formatValue(value: string | number | boolean | null): string {
  if (typeof value !== "string") return String(value);
  return value === "" || NEEDS_QUOTES.test(value) ? JSON.stringify(value) : value;
}

/**
 * Renders context as `[k=v, k=v]`, skipping undefined values.
 *
 * @param context - Key/value pairs.
 * @returns The rendered list, or an empty string when nothing is left to show.
 */
export function formatContext(context?: LogContext): string {
  const pairs = Object.entries(context ?? {})
    .filter((entry): entry is [string, string | number | boolean | null] => entry[1] !== undefined)
    .map(([key, value]) => `${key}=${formatValue(value)}`);
  return pairs.length > 0 ? `[${pairs.join(", ")}]` : "";
}

/**
 * Renders a log record as `time | LEVEL | source | message [k=v]`. When an error is given,
 * its details (stack, code, cause) follow on lines indented by four spaces.
 *
 * @param record - The record to render.
 * @returns The rendered text without a trailing newline.
 */
export function formatLine({ time, level, source, message, context, error }: LogRecord): string {
  const text = [message, formatContext(context)].filter(Boolean).join(" ");
  const line = [formatTimestamp(time), level.padEnd(LEVEL_WIDTH), source, text].join(" | ");
  if (error === undefined) return line;
  const details = inspect(error).replace(/^/gm, "    ");
  return `${line}\n${details}`;
}
