import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import type { ExchangeRateDto } from "@/types/dto";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ apiRequest }));

import { useYearRates } from "./useYearRates";

const ratesOf = (year: number): ExchangeRateDto[] => [{ date: `${year}-05-15`, rate: 31.514 }];

describe("useYearRates", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  /** Each step rerenders the hook with new props, waits for pending requests and checks the result. */
  interface Step {
    year: number | undefined;
    enabled: boolean;
    expected: ExchangeRateDto[] | null;
  }

  const tests: {
    name: string;
    respond?: (path: string) => Promise<unknown>;
    steps: Step[];
    expectedPaths: string[];
    expectLogged?: boolean;
    unmountBeforeLoad?: boolean;
  }[] = [
    {
      name: "fetches the year's rates when enabled",
      steps: [{ year: 2026, enabled: true, expected: ratesOf(2026) }],
      expectedPaths: ["/api/exchange-rates?year=2026"],
    },
    {
      name: "fetches nothing when disabled",
      steps: [{ year: 2026, enabled: false, expected: null }],
      expectedPaths: [],
    },
    {
      name: "fetches nothing before the year is known",
      steps: [{ year: undefined, enabled: true, expected: null }],
      expectedPaths: [],
    },
    {
      name: "switching years fetches the new year and drops the old one",
      steps: [
        { year: 2026, enabled: true, expected: ratesOf(2026) },
        { year: 2025, enabled: false, expected: null },
        { year: 2027, enabled: true, expected: ratesOf(2027) },
        { year: 2026, enabled: true, expected: ratesOf(2026) },
      ],
      expectedPaths: [
        "/api/exchange-rates?year=2026",
        "/api/exchange-rates?year=2027",
        "/api/exchange-rates?year=2026",
      ],
    },
    {
      name: "becoming enabled for the loaded year reuses its rates",
      steps: [
        { year: 2026, enabled: true, expected: ratesOf(2026) },
        { year: 2026, enabled: false, expected: null },
        { year: 2026, enabled: true, expected: ratesOf(2026) },
      ],
      expectedPaths: ["/api/exchange-rates?year=2026"],
    },
    {
      name: "logs and stays unavailable when the fetch fails",
      respond: () => Promise.reject(new Error("down")),
      steps: [{ year: 2026, enabled: true, expected: null }],
      expectedPaths: ["/api/exchange-rates?year=2026"],
      expectLogged: true,
    },
    {
      name: "ignores rates that arrive after unmount",
      steps: [{ year: 2026, enabled: true, expected: null }],
      expectedPaths: ["/api/exchange-rates?year=2026"],
      unmountBeforeLoad: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      apiRequest.mockImplementation(tt.respond ?? ((path: string) => Promise.resolve(ratesOf(Number(path.slice(-4))))));

      const [first, ...rest] = tt.steps;
      const { result, rerender, unmount } = renderHook(({ year, enabled }) => useYearRates(year, enabled), {
        initialProps: first,
      });
      if (tt.unmountBeforeLoad) unmount();
      await act(flushPromises);
      expect(result.current).toEqual(first.expected);

      for (const step of rest) {
        rerender(step);
        await act(flushPromises);
        expect(result.current).toEqual(step.expected);
      }

      expect(apiRequest.mock.calls.map(([path]) => path)).toEqual(tt.expectedPaths);
      expect(logSpy).toHaveBeenCalledTimes(tt.expectLogged ? 1 : 0);
    });
  }
});
