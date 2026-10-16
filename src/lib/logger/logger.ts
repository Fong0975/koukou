import { type EnvVars, readLogConfig } from "./config";
import { formatLine, type LogContext } from "./format";
import { isEnabled, type LogLevel } from "./levels";
import { createRotatingFileSink, type LogSink, type RotatingFileSinkOptions } from "./rotatingFileSink";

/** Writes one record; `error` is a caught value whose details are appended below the line. */
export type LogMethod = (message: string, context?: LogContext, error?: unknown) => void;

/** A logger bound to one source module. */
export interface Logger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

/** Process-wide logging state shared by every logger. */
export interface LogRuntime {
  level: LogLevel;
  /** File destination; absent when file logging is disabled. */
  sink?: LogSink;
}

// Explicit calls rather than `console[name]` so the no-console rule can verify each method, and so
// the current console method is looked up on every call (tests replace it with a spy).
const WRITE_TO_CONSOLE: Record<LogLevel, (line: string) => void> = {
  DEBUG: (line) => console.debug(line),
  INFO: (line) => console.info(line),
  WARN: (line) => console.warn(line),
  ERROR: (line) => console.error(line),
};

const LOGGER_SOURCE = "logger";

function emit(
  runtime: LogRuntime,
  level: LogLevel,
  source: string,
  message: string,
  context?: LogContext,
  error?: unknown,
): void {
  if (!isEnabled(level, runtime.level)) return;
  const line = formatLine({ time: new Date(), level, source, message, context, error });
  WRITE_TO_CONSOLE[level](line);
  runtime.sink?.write(line);
}

/**
 * Builds the logging state from environment variables and reports invalid settings as warnings.
 *
 * @param env - Environment variables; defaults to `process.env`.
 * @param createSink - Sink factory; defaults to the rotating file sink.
 * @returns The runtime.
 */
export function createLogRuntime(
  env: EnvVars = process.env,
  createSink: (options: RotatingFileSinkOptions) => LogSink = createRotatingFileSink,
): LogRuntime {
  const { config, warnings } = readLogConfig(env);
  const runtime: LogRuntime = { level: config.level };

  if (config.fileEnabled) {
    runtime.sink = createSink({
      filePath: config.filePath,
      maxBytes: config.maxFileBytes,
      maxFiles: config.maxFiles,
      onError: (error) =>
        console.error(
          formatLine({
            time: new Date(),
            level: "ERROR",
            source: LOGGER_SOURCE,
            message: "Failed to write log file; file logging is disabled",
            context: { path: config.filePath },
            error,
          }),
        ),
    });
  }

  for (const warning of warnings) emit(runtime, "WARN", LOGGER_SOURCE, warning);
  emit(runtime, "INFO", LOGGER_SOURCE, "Logging configured", {
    level: config.level,
    file: config.fileEnabled ? config.filePath : "disabled",
    max_file_size_mb: config.fileEnabled ? config.maxFileBytes / (1024 * 1024) : undefined,
    max_files: config.fileEnabled ? config.maxFiles : undefined,
  });
  return runtime;
}

// Share one runtime across hot reloads in development so the log file is not opened twice.
const globalForLogger = globalThis as unknown as { koukouLogRuntime?: LogRuntime };

/** Returns the shared runtime, creating it on first use. */
function getSharedRuntime(): LogRuntime {
  return (globalForLogger.koukouLogRuntime ??= createLogRuntime());
}

/**
 * Creates a logger for one module. Records go to the console and, when enabled, to the log file.
 * Configuration is read lazily on the first record, after `.env` has been loaded.
 *
 * @param source - Module name shown in each record, e.g. `subscriptionService`.
 * @param getRuntime - Runtime provider; defaults to the shared process-wide runtime.
 * @returns The logger.
 */
export function createLogger(source: string, getRuntime: () => LogRuntime = getSharedRuntime): Logger {
  const method =
    (level: LogLevel): LogMethod =>
    (message, context, error) =>
      emit(getRuntime(), level, source, message, context, error);

  return { debug: method("DEBUG"), info: method("INFO"), warn: method("WARN"), error: method("ERROR") };
}
