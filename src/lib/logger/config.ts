import path from "node:path";
import { isLogLevel, type LogLevel } from "./levels";

/** Resolved logging settings. */
export interface LogConfig {
  /** Whether records are also written to a file (they always go to the console). */
  fileEnabled: boolean;
  /** Absolute path of the active log file. */
  filePath: string;
  /** Lowest level that is output. */
  level: LogLevel;
  /** Size at which the active file is rotated. */
  maxFileBytes: number;
  /** Most log files kept, including the active one. */
  maxFiles: number;
}

/** A resolved config plus a message for every setting that was invalid and fell back to its default. */
export interface LogConfigResult {
  config: LogConfig;
  warnings: string[];
}

const DEFAULT_FILE_PATH = "koukou.log";
const DEFAULT_LEVEL: LogLevel = "INFO";
const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_MAX_FILES = 5;
const BYTES_PER_MB = 1024 * 1024;

/**
 * Environment variables as read by the logger. Looser than `NodeJS.ProcessEnv`, which Next.js
 * extends with a required `NODE_ENV`, so callers and tests can pass a partial set.
 */
export type EnvVars = Readonly<Record<string, string | undefined>>;

type Parser<T> = (raw: string) => T | undefined;

const parseBoolean: Parser<boolean> = (raw) => ({ true: true, false: false })[raw.toLowerCase()];

const parseLevel: Parser<LogLevel> = (raw) => {
  const upper = raw.toUpperCase();
  return isLogLevel(upper) ? upper : undefined;
};

const parsePositiveNumber: Parser<number> = (raw) => {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

const parsePositiveInteger: Parser<number> = (raw) => {
  const value = parsePositiveNumber(raw);
  return value !== undefined && Number.isInteger(value) ? value : undefined;
};

/**
 * Reads one setting; a missing or blank value silently uses the default, an invalid one
 * uses the default and records a warning.
 */
function readSetting<T>(env: EnvVars, name: string, parse: Parser<T>, fallback: T, warnings: string[]): T {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const value = parse(raw);
  if (value !== undefined) return value;
  warnings.push(`Invalid ${name}="${raw}", using default ${String(fallback)}`);
  return fallback;
}

/**
 * Builds the logging config from environment variables. Never throws: invalid values fall
 * back to their defaults so a typo in `.env` cannot stop the server from starting.
 *
 * - `LOG_FILE_ENABLED` (true/false, default true)
 * - `LOG_FILE_PATH` (default `koukou.log`, relative paths resolve from `cwd`)
 * - `LOG_LEVEL` (DEBUG/INFO/WARN/ERROR, case-insensitive, default INFO)
 * - `LOG_MAX_FILE_SIZE_MB` (positive number, default 10)
 * - `LOG_MAX_FILES` (positive integer including the active file, default 5)
 *
 * @param env - Environment variables; defaults to `process.env`.
 * @param cwd - Base directory for a relative file path; defaults to the project root.
 * @returns The config and any warnings about invalid values.
 */
export function readLogConfig(env: EnvVars = process.env, cwd: string = process.cwd()): LogConfigResult {
  const warnings: string[] = [];
  const maxFileSizeMb = readSetting(
    env,
    "LOG_MAX_FILE_SIZE_MB",
    parsePositiveNumber,
    DEFAULT_MAX_FILE_SIZE_MB,
    warnings,
  );

  const config: LogConfig = {
    fileEnabled: readSetting(env, "LOG_FILE_ENABLED", parseBoolean, true, warnings),
    filePath: path.resolve(cwd, env.LOG_FILE_PATH?.trim() || DEFAULT_FILE_PATH),
    level: readSetting(env, "LOG_LEVEL", parseLevel, DEFAULT_LEVEL, warnings),
    maxFileBytes: Math.max(1, Math.round(maxFileSizeMb * BYTES_PER_MB)),
    maxFiles: readSetting(env, "LOG_MAX_FILES", parsePositiveInteger, DEFAULT_MAX_FILES, warnings),
  };
  return { config, warnings };
}
