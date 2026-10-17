// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExchangeRateDto } from "@/types/dto";

const { clientMock } = vi.hoisted(() => ({
  clientMock: { fetchDailyRates: vi.fn(), fetchLatestRate: vi.fn() },
}));

vi.mock("./frankfurterClient", () => clientMock);

import { getYearRates } from "./exchangeRateService";

afterEach(() => {
  vi.clearAllMocks();
});

describe("getYearRates", () => {
  const latest: ExchangeRateDto = { date: "2026-10-16", rate: 32.314 };

  const tests: {
    name: string;
    year: number;
    daily: ExchangeRateDto[];
    expected: ExchangeRateDto[];
    latestFetched: boolean;
  }[] = [
    {
      name: "returns the year's daily rates ordered by date",
      year: 2026,
      daily: [
        { date: "2026-05-15", rate: 31.514 },
        { date: "2026-01-02", rate: 31.365 },
      ],
      expected: [
        { date: "2026-01-02", rate: 31.365 },
        { date: "2026-05-15", rate: 31.514 },
      ],
      latestFetched: false,
    },
    {
      name: "falls back to the latest rate for a year entirely in the future",
      year: 2027,
      daily: [],
      expected: [latest],
      latestFetched: true,
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      clientMock.fetchDailyRates.mockResolvedValue(tt.daily);
      clientMock.fetchLatestRate.mockResolvedValue(latest);

      await expect(getYearRates(tt.year)).resolves.toEqual(tt.expected);
      expect(clientMock.fetchDailyRates).toHaveBeenCalledWith(`${tt.year}-01-01`, `${tt.year}-12-31`);
      expect(clientMock.fetchLatestRate).toHaveBeenCalledTimes(tt.latestFetched ? 1 : 0);
    });
  }
});
