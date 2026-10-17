// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "@/lib/errors";

const { serviceMock } = vi.hoisted(() => ({ serviceMock: { getYearRates: vi.fn() } }));

vi.mock("@/services/exchangeRateService", () => serviceMock);

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/exchange-rates", () => {
  const rates = [{ date: "2026-05-15", rate: 31.514 }];

  const tests: {
    name: string;
    query: string;
    result?: () => Promise<unknown>;
    status: number;
    body?: unknown;
    serviceYear?: number;
  }[] = [
    {
      name: "returns the year's rates",
      query: "?year=2026",
      result: () => Promise.resolve(rates),
      status: 200,
      body: { data: rates },
      serviceYear: 2026,
    },
    {
      name: "rate service failure → 502",
      query: "?year=2026",
      result: () => Promise.reject(new UpstreamError("無法取得匯率，請稍後再試")),
      status: 502,
      body: { error: { code: "UPSTREAM_ERROR", message: "無法取得匯率，請稍後再試" } },
      serviceYear: 2026,
    },
    { name: "missing year → 400", query: "", status: 400 },
    { name: "invalid year → 400", query: "?year=abc", status: 400 },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      if (tt.result) serviceMock.getYearRates.mockImplementation(tt.result);

      const response = await GET(new Request(`http://localhost/api/exchange-rates${tt.query}`), undefined);

      expect(response.status).toBe(tt.status);
      if (tt.body !== undefined) await expect(response.json()).resolves.toEqual(tt.body);
      if (tt.serviceYear === undefined) expect(serviceMock.getYearRates).not.toHaveBeenCalled();
      else expect(serviceMock.getYearRates).toHaveBeenCalledWith(tt.serviceYear);
    });
  }
});
