// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isEnabled, isLogLevel, type LogLevel } from "./levels";

describe("isLogLevel", () => {
  const tests = [
    { name: "known level", value: "WARN", expected: true },
    { name: "lower case is not a level", value: "warn", expected: false },
    { name: "unknown name", value: "TRACE", expected: false },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isLogLevel(tt.value)).toBe(tt.expected);
    });
  }
});

describe("isEnabled", () => {
  const tests: { name: string; level: LogLevel; threshold: LogLevel; expected: boolean }[] = [
    { name: "same level passes", level: "INFO", threshold: "INFO", expected: true },
    { name: "more severe passes", level: "ERROR", threshold: "WARN", expected: true },
    { name: "less severe is filtered", level: "DEBUG", threshold: "INFO", expected: false },
    { name: "DEBUG threshold lets everything through", level: "DEBUG", threshold: "DEBUG", expected: true },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(isEnabled(tt.level, tt.threshold)).toBe(tt.expected);
    });
  }
});
