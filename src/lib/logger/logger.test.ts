// @vitest-environment node
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EnvVars } from "./config";
import { formatContext } from "./format";
import type { LogLevel } from "./levels";
import { createLogger, createLogRuntime, type Logger, type LogRuntime } from "./logger";
import type { LogSink, RotatingFileSinkOptions } from "./rotatingFileSink";

const consoleMethods = ["debug", "info", "warn", "error"] as const;

type ConsoleMethod = (typeof consoleMethods)[number];

const mute = (method: ConsoleMethod) => vi.spyOn(console, method).mockImplementation(() => {});

let consoleSpies: Record<ConsoleMethod, ReturnType<typeof mute>>;

beforeEach(() => {
  consoleSpies = { debug: mute("debug"), info: mute("info"), warn: mute("warn"), error: mute("error") };
});

afterEach(() => {
  vi.restoreAllMocks();
});

const PREFIX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2} \| /;

describe("createLogger", () => {
  const tests: {
    name: string;
    threshold: LogLevel;
    withSink: boolean;
    log: (logger: Logger) => void;
    expectedConsole: Partial<Record<ConsoleMethod, string>>;
  }[] = [
    {
      name: "info goes to console.info and the file",
      threshold: "INFO",
      withSink: true,
      log: (logger) => logger.info("Saved", { id: 1 }),
      expectedConsole: { info: "INFO  | svc | Saved [id=1]" },
    },
    {
      name: "debug is filtered below the threshold",
      threshold: "INFO",
      withSink: true,
      log: (logger) => logger.debug("Details"),
      expectedConsole: {},
    },
    {
      name: "debug passes a DEBUG threshold",
      threshold: "DEBUG",
      withSink: true,
      log: (logger) => logger.debug("Details"),
      expectedConsole: { debug: "DEBUG | svc | Details" },
    },
    {
      name: "warn maps to console.warn",
      threshold: "INFO",
      withSink: true,
      log: (logger) => logger.warn("Careful"),
      expectedConsole: { warn: "WARN  | svc | Careful" },
    },
    {
      name: "error maps to console.error and includes the error",
      threshold: "ERROR",
      withSink: true,
      log: (logger) => logger.error("Failed", undefined, "oops"),
      expectedConsole: { error: "ERROR | svc | Failed\n    'oops'" },
    },
    {
      name: "without a sink records still reach the console",
      threshold: "INFO",
      withSink: false,
      log: (logger) => logger.info("Console only"),
      expectedConsole: { info: "INFO  | svc | Console only" },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const sink = { write: vi.fn() };
      const runtime: LogRuntime = { level: tt.threshold, sink: tt.withSink ? sink : undefined };

      tt.log(createLogger("svc", () => runtime));

      const lines: string[] = [];
      for (const method of consoleMethods) {
        const expected = tt.expectedConsole[method];
        if (expected === undefined) {
          expect(consoleSpies[method]).not.toHaveBeenCalled();
          continue;
        }
        expect(consoleSpies[method]).toHaveBeenCalledTimes(1);
        const line = consoleSpies[method].mock.calls[0][0] as string;
        expect(line).toMatch(PREFIX);
        expect(line.replace(PREFIX, "")).toBe(expected);
        lines.push(line);
      }
      expect(sink.write.mock.calls.map(([line]) => line)).toEqual(tt.withSink ? lines : []);
    });
  }
});

describe("createLogRuntime", () => {
  const defaultFile = path.resolve("koukou.log");
  const defaultSink = { filePath: defaultFile, maxBytes: 10 * 1024 * 1024, maxFiles: 5 };
  const defaultInfo = `INFO  | logger | Logging configured ${formatContext({
    level: "INFO",
    file: defaultFile,
    max_file_size_mb: 10,
    max_files: 5,
  })}`;

  const tests: {
    name: string;
    env: EnvVars;
    expectedLevel: LogLevel;
    expectedSink?: Omit<RotatingFileSinkOptions, "onError">;
    /** Simulates the sink reporting a write failure. */
    writeError?: Error;
    expectedWarnings: string[];
    /** Expected "Logging configured" record, or undefined when INFO is filtered out. */
    expectedInfo?: string;
    expectedErrors?: RegExp[];
  }[] = [
    {
      name: "file logging enabled by default",
      env: {},
      expectedLevel: "INFO",
      expectedSink: defaultSink,
      expectedWarnings: [],
      expectedInfo: defaultInfo,
    },
    {
      name: "file logging disabled creates no sink",
      env: { LOG_FILE_ENABLED: "false", LOG_LEVEL: "error" },
      expectedLevel: "ERROR",
      expectedWarnings: [],
    },
    {
      name: "invalid settings are reported as warnings",
      env: { LOG_FILE_ENABLED: "false", LOG_MAX_FILES: "0" },
      expectedLevel: "INFO",
      expectedWarnings: ['WARN  | logger | Invalid LOG_MAX_FILES="0", using default 5'],
      expectedInfo: "INFO  | logger | Logging configured [level=INFO, file=disabled]",
    },
    {
      name: "a file write failure is reported on the console",
      env: {},
      expectedLevel: "INFO",
      expectedSink: defaultSink,
      writeError: new Error("disk full"),
      expectedWarnings: [],
      expectedInfo: defaultInfo,
      expectedErrors: [
        /^ERROR \| logger \| Failed to write log file; file logging is disabled \[path=.*koukou\.log"?\]\n {4}Error: disk full/,
      ],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const sink: LogSink = { write: vi.fn() };
      const createSink = vi.fn((_options: RotatingFileSinkOptions) => sink);

      const runtime = createLogRuntime(tt.env, createSink);
      if (tt.writeError) createSink.mock.calls[0][0].onError(tt.writeError);

      expect(runtime.level).toBe(tt.expectedLevel);
      if (tt.expectedSink) {
        expect(runtime.sink).toBe(sink);
        expect(createSink).toHaveBeenCalledWith({ ...tt.expectedSink, onError: expect.any(Function) });
      } else {
        expect(runtime.sink).toBeUndefined();
        expect(createSink).not.toHaveBeenCalled();
      }
      expect(consoleSpies.warn.mock.calls.map(([line]) => String(line).replace(PREFIX, ""))).toEqual(
        tt.expectedWarnings,
      );
      expect(consoleSpies.info.mock.calls.map(([line]) => String(line).replace(PREFIX, ""))).toEqual(
        tt.expectedInfo ? [tt.expectedInfo] : [],
      );
      const errors = consoleSpies.error.mock.calls.map(([line]) => String(line).replace(PREFIX, ""));
      expect(errors).toHaveLength(tt.expectedErrors?.length ?? 0);
      tt.expectedErrors?.forEach((pattern, index) => expect(errors[index]).toMatch(pattern));
    });
  }
});
