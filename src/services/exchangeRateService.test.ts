// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";
import type { ExchangeRateDto } from "@/types/dto";
import type { RateSync } from "./exchangeRateStore";

const { clientMock, storeMock } = vi.hoisted(() => ({
  clientMock: { fetchDailyRates: vi.fn(), fetchLatestRate: vi.fn() },
  storeMock: { findRates: vi.fn(), findLatestRate: vi.fn(), saveRates: vi.fn(), findSync: vi.fn(), saveSync: vi.fn() },
}));

vi.mock("./frankfurterClient", () => clientMock);
vi.mock("./exchangeRateStore", () => storeMock);
vi.mock("@/lib/logger", () => import("@/test/logger"));

import { loggerMock } from "@/test/logger";
import { getYearRates } from "./exchangeRateService";

/** Noon of a day in the local time zone, which `todayKey` reads. */
const localNoon = (key: string) => new Date(`${key}T12:00:00`);

const upstreamError = new UpstreamError("無法取得匯率，請稍後再試");

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("getYearRates", () => {
  const stored2026: ExchangeRateDto[] = [
    { date: "2026-01-02", rate: 31.365 },
    { date: "2026-10-16", rate: 32.314 },
  ];
  const stored2025: ExchangeRateDto[] = [
    { date: "2025-01-02", rate: 32.9 },
    { date: "2025-12-31", rate: 31.437 },
  ];
  const latest: ExchangeRateDto = { date: "2026-10-16", rate: 32.314 };

  const tests: {
    name: string;
    today: string;
    year: number;
    /** Sync record of the year being synced. */
    sync: RateSync | null;
    /** Last stored rate of the year being synced. */
    lastInYear?: ExchangeRateDto | null;
    /** Result of fetching the daily rates, or the error it throws. */
    daily?: ExchangeRateDto[] | Error;
    /** Rates stored for the requested year once synced. */
    stored?: ExchangeRateDto[];
    /** Latest stored rate of any day. */
    latestStored?: ExchangeRateDto | null;
    /** Result of fetching the latest rate, or the error it throws. */
    latestFetched?: ExchangeRateDto | Error;
    expected: ExchangeRateDto[] | Error;
    expectedFetch: [string, string] | null;
    expectedSaved: ExchangeRateDto[][];
    expectedSync: [number, RateSync] | null;
    expectedWarn?: boolean;
  }[] = [
    {
      name: "serves a complete year from the database",
      today: "2026-10-19",
      year: 2025,
      sync: { syncedOn: "2026-01-10", complete: true },
      stored: stored2025,
      expected: stored2025,
      expectedFetch: null,
      expectedSaved: [],
      expectedSync: null,
    },
    {
      name: "serves a year already synced today from the database",
      today: "2026-10-19",
      year: 2026,
      sync: { syncedOn: "2026-10-19", complete: false },
      stored: stored2026,
      expected: stored2026,
      expectedFetch: null,
      expectedSaved: [],
      expectedSync: null,
    },
    {
      name: "fetches the days after the last stored rate once a day",
      today: "2026-10-19",
      year: 2026,
      sync: { syncedOn: "2026-10-16", complete: false },
      lastInYear: { date: "2026-10-15", rate: 32.2 },
      daily: [latest],
      stored: stored2026,
      expected: stored2026,
      expectedFetch: ["2026-10-16", "2026-12-31"],
      expectedSaved: [[latest]],
      expectedSync: [2026, { syncedOn: "2026-10-19", complete: false }],
    },
    {
      name: "fetches a never-synced year in full and marks it complete once it has settled",
      today: "2026-10-19",
      year: 2025,
      sync: null,
      daily: stored2025,
      stored: stored2025,
      expected: stored2025,
      expectedFetch: ["2025-01-01", "2025-12-31"],
      expectedSaved: [stored2025],
      expectedSync: [2025, { syncedOn: "2026-10-19", complete: true }],
    },
    {
      name: "keeps a year incomplete within its settle days",
      today: "2026-01-06",
      year: 2025,
      sync: null,
      daily: stored2025,
      stored: stored2025,
      expected: stored2025,
      expectedFetch: ["2025-01-01", "2025-12-31"],
      expectedSaved: [stored2025],
      expectedSync: [2025, { syncedOn: "2026-01-06", complete: false }],
    },
    {
      name: "marks a year complete without fetching when its last day is already stored",
      today: "2026-01-07",
      year: 2025,
      sync: { syncedOn: "2026-01-06", complete: false },
      lastInYear: { date: "2025-12-31", rate: 31.437 },
      stored: stored2025,
      expected: stored2025,
      expectedFetch: null,
      expectedSaved: [[]],
      expectedSync: [2025, { syncedOn: "2026-01-07", complete: true }],
    },
    {
      name: "syncs the current year and serves the latest stored rate for a future year",
      today: "2026-10-19",
      year: 2027,
      sync: { syncedOn: "2026-10-19", complete: false },
      latestStored: latest,
      expected: [latest],
      expectedFetch: null,
      expectedSaved: [],
      expectedSync: null,
    },
    {
      name: "fetches and stores the latest rate when nothing is stored",
      today: "2026-01-01",
      year: 2026,
      sync: null,
      daily: [],
      stored: [],
      latestStored: null,
      latestFetched: { date: "2025-12-31", rate: 31.437 },
      expected: [{ date: "2025-12-31", rate: 31.437 }],
      expectedFetch: ["2026-01-01", "2026-12-31"],
      expectedSaved: [[], [{ date: "2025-12-31", rate: 31.437 }]],
      expectedSync: [2026, { syncedOn: "2026-01-01", complete: false }],
    },
    {
      name: "falls back to the stored rates when fetching fails",
      today: "2026-10-19",
      year: 2026,
      sync: { syncedOn: "2026-10-16", complete: false },
      lastInYear: { date: "2026-10-16", rate: 32.314 },
      daily: upstreamError,
      stored: stored2026,
      expected: stored2026,
      expectedFetch: ["2026-10-17", "2026-12-31"],
      expectedSaved: [],
      expectedSync: null,
      expectedWarn: true,
    },
    {
      name: "fails when fetching fails and nothing is stored",
      today: "2026-10-19",
      year: 2026,
      sync: null,
      daily: upstreamError,
      stored: [],
      latestStored: null,
      latestFetched: upstreamError,
      expected: upstreamError,
      expectedFetch: ["2026-01-01", "2026-12-31"],
      expectedSaved: [],
      expectedSync: null,
      expectedWarn: true,
    },
  ];

  const settle = <T>(value: T | Error | undefined) =>
    value instanceof Error ? Promise.reject(value) : Promise.resolve(value);

  for (const tt of tests) {
    it(tt.name, async () => {
      vi.useFakeTimers({ now: localNoon(tt.today) });
      storeMock.findSync.mockResolvedValue(tt.sync);
      storeMock.findLatestRate.mockImplementation((until?: string) =>
        Promise.resolve(until === undefined ? (tt.latestStored ?? null) : (tt.lastInYear ?? null)),
      );
      storeMock.findRates.mockResolvedValue(tt.stored ?? []);
      clientMock.fetchDailyRates.mockImplementation(() => settle(tt.daily));
      clientMock.fetchLatestRate.mockImplementation(() => settle(tt.latestFetched));

      const result = getYearRates(tt.year);

      if (tt.expected instanceof Error) {
        await expect(result).rejects.toThrow(tt.expected);
      } else {
        await expect(result).resolves.toEqual(tt.expected);
      }
      if (tt.expectedFetch) {
        expect(clientMock.fetchDailyRates).toHaveBeenCalledWith(...tt.expectedFetch);
      } else {
        expect(clientMock.fetchDailyRates).not.toHaveBeenCalled();
      }
      expect(storeMock.saveRates.mock.calls).toEqual(tt.expectedSaved.map((rates) => [rates]));
      if (tt.expectedSync) {
        expect(storeMock.saveSync).toHaveBeenCalledWith(...tt.expectedSync);
      } else {
        expect(storeMock.saveSync).not.toHaveBeenCalled();
      }
      expect(loggerMock.warn).toHaveBeenCalledTimes(tt.expectedWarn ? 1 : 0);
    });
  }
});
