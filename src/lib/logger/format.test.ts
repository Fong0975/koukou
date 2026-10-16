// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatContext, formatLine, formatTimestamp, type LogContext, type LogRecord } from "./format";

// Built from local fields so the rendered wall-clock time does not depend on the machine's time zone.
const time = new Date(2026, 7, 29, 12, 54, 38, 286);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("formatTimestamp", () => {
  const tests = [
    { name: "positive offset", date: time, offsetMinutes: -480, expected: "2026-08-29T12:54:38.286+08:00" },
    { name: "negative offset with minutes", date: time, offsetMinutes: 210, expected: "2026-08-29T12:54:38.286-03:30" },
    { name: "UTC", date: time, offsetMinutes: 0, expected: "2026-08-29T12:54:38.286+00:00" },
    {
      name: "pads single-digit fields",
      date: new Date(2026, 0, 2, 3, 4, 5, 6),
      offsetMinutes: -540,
      expected: "2026-01-02T03:04:05.006+09:00",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(tt.offsetMinutes);
      expect(formatTimestamp(tt.date)).toBe(tt.expected);
    });
  }
});

describe("formatContext", () => {
  const tests: { name: string; context?: LogContext; expected: string }[] = [
    { name: "no context", context: undefined, expected: "" },
    { name: "only undefined values", context: { a: undefined }, expected: "" },
    {
      name: "plain values",
      context: { method: "GET", status: 200, ok: true, note: null },
      expected: "[method=GET, status=200, ok=true, note=null]",
    },
    {
      name: "quotes strings that would be ambiguous",
      context: { name: "Disney Plus", list: "a,b", empty: "", eq: "k=v", path: "/api/x" },
      expected: '[name="Disney Plus", list="a,b", empty="", eq="k=v", path=/api/x]',
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(formatContext(tt.context)).toBe(tt.expected);
    });
  }
});

describe("formatLine", () => {
  const error = new Error("boom");
  error.stack = "Error: boom\n    at handler (route.ts:42:7)";

  const base: LogRecord = { time, level: "INFO", source: "api/subscriptions", message: "Request processed" };

  const tests: { name: string; record: Partial<LogRecord>; expected: string }[] = [
    {
      name: "message only",
      record: {},
      expected: "2026-08-29T12:54:38.286+08:00 | INFO  | api/subscriptions | Request processed",
    },
    {
      name: "message with context",
      record: { context: { method: "GET", status: 200 } },
      expected:
        "2026-08-29T12:54:38.286+08:00 | INFO  | api/subscriptions | Request processed [method=GET, status=200]",
    },
    {
      name: "error details follow on indented lines",
      record: { level: "ERROR", message: "Unhandled API error", error },
      expected:
        "2026-08-29T12:54:38.286+08:00 | ERROR | api/subscriptions | Unhandled API error\n" +
        "    Error: boom\n" +
        "        at handler (route.ts:42:7)",
    },
    {
      name: "a non-error thrown value is inspected",
      record: { level: "WARN", error: "oops" },
      expected: "2026-08-29T12:54:38.286+08:00 | WARN  | api/subscriptions | Request processed\n    'oops'",
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-480);
      expect(formatLine({ ...base, ...tt.record })).toBe(tt.expected);
    });
  }
});
