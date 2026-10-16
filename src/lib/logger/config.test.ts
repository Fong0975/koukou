// @vitest-environment node
import path from "node:path";
import { describe, expect, it } from "vitest";
import { type EnvVars, type LogConfig, readLogConfig } from "./config";

const cwd = path.resolve("/srv/koukou");
const MB = 1024 * 1024;

const defaults: LogConfig = {
  fileEnabled: true,
  filePath: path.resolve(cwd, "koukou.log"),
  level: "INFO",
  maxFileBytes: 10 * MB,
  maxFiles: 5,
};

describe("readLogConfig", () => {
  const tests: { name: string; env: EnvVars; expected: Partial<LogConfig>; warnings?: string[] }[] = [
    { name: "nothing set uses the defaults", env: {}, expected: {} },
    {
      name: "blank values use the defaults without warnings",
      env: { LOG_FILE_ENABLED: " ", LOG_FILE_PATH: "", LOG_LEVEL: "", LOG_MAX_FILE_SIZE_MB: "", LOG_MAX_FILES: "" },
      expected: {},
    },
    {
      name: "valid values are used",
      env: {
        LOG_FILE_ENABLED: "false",
        LOG_FILE_PATH: "logs/app.log",
        LOG_LEVEL: "DEBUG",
        LOG_MAX_FILE_SIZE_MB: "2",
        LOG_MAX_FILES: "3",
      },
      expected: {
        fileEnabled: false,
        filePath: path.resolve(cwd, "logs/app.log"),
        level: "DEBUG",
        maxFileBytes: 2 * MB,
        maxFiles: 3,
      },
    },
    {
      name: "boolean and level ignore case and surrounding spaces",
      env: { LOG_FILE_ENABLED: " TRUE ", LOG_LEVEL: "warn" },
      expected: { fileEnabled: true, level: "WARN" },
    },
    {
      name: "an absolute path is kept",
      env: { LOG_FILE_PATH: path.resolve("/var/log/koukou.log") },
      expected: { filePath: path.resolve("/var/log/koukou.log") },
    },
    {
      name: "a fractional size is converted to whole bytes",
      env: { LOG_MAX_FILE_SIZE_MB: "0.5" },
      expected: { maxFileBytes: 0.5 * MB },
    },
    {
      name: "invalid values fall back with a warning each",
      env: {
        LOG_FILE_ENABLED: "yes",
        LOG_LEVEL: "TRACE",
        LOG_MAX_FILE_SIZE_MB: "0",
        LOG_MAX_FILES: "2.5",
      },
      expected: {},
      warnings: [
        'Invalid LOG_MAX_FILE_SIZE_MB="0", using default 10',
        'Invalid LOG_FILE_ENABLED="yes", using default true',
        'Invalid LOG_LEVEL="TRACE", using default INFO',
        'Invalid LOG_MAX_FILES="2.5", using default 5',
      ],
    },
    {
      name: "negative and non-numeric numbers fall back",
      env: { LOG_MAX_FILE_SIZE_MB: "-1", LOG_MAX_FILES: "abc" },
      expected: {},
      warnings: ['Invalid LOG_MAX_FILE_SIZE_MB="-1", using default 10', 'Invalid LOG_MAX_FILES="abc", using default 5'],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(readLogConfig(tt.env, cwd)).toEqual({
        config: { ...defaults, ...tt.expected },
        warnings: tt.warnings ?? [],
      });
    });
  }
});
