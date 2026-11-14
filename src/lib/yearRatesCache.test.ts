import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("./apiClient", () => ({ apiRequest }));

import { clearYearRatesCache, fetchYearRates } from "./yearRatesCache";

describe("fetchYearRates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    clearYearRatesCache();
  });
  afterEach(() => vi.useRealTimers());

  const MINUTE = 60 * 1000;
  const tests: {
    name: string;
    respond?: () => Promise<unknown>;
    /** Each call fetches the year after waiting the given time. */
    calls: { year: number; waitMs?: number }[];
    expectedPaths: string[];
  }[] = [
    {
      name: "shares one request for the same year",
      calls: [{ year: 2026 }, { year: 2026, waitMs: 9 * MINUTE }],
      expectedPaths: ["/api/exchange-rates?year=2026"],
    },
    {
      name: "requests each year separately",
      calls: [{ year: 2026 }, { year: 2025 }],
      expectedPaths: ["/api/exchange-rates?year=2026", "/api/exchange-rates?year=2025"],
    },
    {
      name: "requests again once the cached rates are old",
      calls: [{ year: 2026 }, { year: 2026, waitMs: 11 * MINUTE }],
      expectedPaths: ["/api/exchange-rates?year=2026", "/api/exchange-rates?year=2026"],
    },
    {
      name: "does not keep a failed request",
      respond: () => Promise.reject(new Error("down")),
      calls: [{ year: 2026 }, { year: 2026 }],
      expectedPaths: ["/api/exchange-rates?year=2026", "/api/exchange-rates?year=2026"],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      apiRequest.mockImplementation(tt.respond ?? (() => Promise.resolve([])));

      for (const call of tt.calls) {
        vi.advanceTimersByTime(call.waitMs ?? 0);
        await fetchYearRates(call.year).catch(() => undefined);
      }

      expect(apiRequest.mock.calls.map(([path]) => path)).toEqual(tt.expectedPaths);
    });
  }
});
