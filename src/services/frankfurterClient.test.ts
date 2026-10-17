// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";

vi.mock("@/lib/logger", () => import("@/test/logger"));

import { loggerMock } from "@/test/logger";
import { fetchDailyRates, fetchLatestRate } from "./frankfurterClient";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const json =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve(Response.json(body, { status }));

/** Failures shared by both endpoints; every one surfaces as an UpstreamError and a warning. */
const failures: { name: string; respond: () => Promise<Response> }[] = [
  { name: "network failure", respond: () => Promise.reject(new TypeError("fetch failed")) },
  { name: "error status", respond: json({ status: 404, message: "not found" }, 404) },
  { name: "malformed JSON", respond: () => Promise.resolve(new Response("<html>")) },
];

describe("fetchDailyRates", () => {
  const url = "https://api.frankfurter.dev/v2/rates?base=USD&quotes=TWD&from=2026-05-14&to=2026-05-15";

  const tests: { name: string; respond: () => Promise<Response>; expected?: unknown }[] = [
    {
      name: "keeps only the date and rate of each entry",
      respond: json([
        { date: "2026-05-14", base: "USD", quote: "TWD", rate: 31.492 },
        { date: "2026-05-15", base: "USD", quote: "TWD", rate: 31.514 },
      ]),
      expected: [
        { date: "2026-05-14", rate: 31.492 },
        { date: "2026-05-15", rate: 31.514 },
      ],
    },
    { name: "empty range", respond: json([]), expected: [] },
    { name: "unexpected shape", respond: json([{ date: "2026-05-14", rate: "31.492" }]) },
    ...failures,
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      fetchMock.mockImplementation(tt.respond);

      const result = fetchDailyRates("2026-05-14", "2026-05-15");

      if (tt.expected === undefined) {
        await expect(result).rejects.toThrow(new UpstreamError("無法取得匯率，請稍後再試"));
        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      } else {
        await expect(result).resolves.toEqual(tt.expected);
        expect(loggerMock.warn).not.toHaveBeenCalled();
      }
      expect(fetchMock).toHaveBeenCalledWith(url, { cache: "no-store" });
    });
  }
});

describe("fetchLatestRate", () => {
  const url = "https://api.frankfurter.dev/v2/rate/USD/TWD";

  const tests: { name: string; respond: () => Promise<Response>; expected?: unknown }[] = [
    {
      name: "returns the date and rate",
      respond: json({ date: "2026-10-16", base: "USD", quote: "TWD", rate: 32.314 }),
      expected: { date: "2026-10-16", rate: 32.314 },
    },
    { name: "unexpected shape", respond: json({ date: "2026-10-16", rate: 0 }) },
    ...failures,
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      fetchMock.mockImplementation(tt.respond);

      const result = fetchLatestRate();

      if (tt.expected === undefined) {
        await expect(result).rejects.toThrow(new UpstreamError("無法取得匯率，請稍後再試"));
        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      } else {
        await expect(result).resolves.toEqual(tt.expected);
        expect(loggerMock.warn).not.toHaveBeenCalled();
      }
      expect(fetchMock).toHaveBeenCalledWith(url, { cache: "no-store" });
    });
  }
});
