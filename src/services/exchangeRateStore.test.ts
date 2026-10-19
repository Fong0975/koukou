// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    exchangeRate: { findMany: vi.fn(), findFirst: vi.fn(), createMany: vi.fn() },
    exchangeRateSync: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { findLatestRate, findRates, findSync, saveRates, saveSync } from "./exchangeRateStore";

const pair = { base: "USD", quote: "TWD" };
const utc = (key: string) => new Date(`${key}T00:00:00.000Z`);
const decimal = (value: number) => ({ toNumber: () => value });
const rateSelect = { date: true, rate: true };

afterEach(() => {
  vi.clearAllMocks();
});

describe("findRates", () => {
  const tests = [
    {
      name: "converts the stored rows to rates",
      records: [
        { date: utc("2026-01-02"), rate: decimal(31.365) },
        { date: utc("2026-05-15"), rate: decimal(31.514) },
      ],
      expected: [
        { date: "2026-01-02", rate: 31.365 },
        { date: "2026-05-15", rate: 31.514 },
      ],
    },
    { name: "no stored rows", records: [], expected: [] },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.exchangeRate.findMany.mockResolvedValue(tt.records);

      await expect(findRates("2026-01-01", "2026-12-31")).resolves.toEqual(tt.expected);
      expect(prismaMock.exchangeRate.findMany).toHaveBeenCalledWith({
        where: { ...pair, date: { gte: utc("2026-01-01"), lte: utc("2026-12-31") } },
        select: rateSelect,
        orderBy: { date: "asc" },
      });
    });
  }
});

describe("findLatestRate", () => {
  const tests = [
    {
      name: "reads the latest of every stored day",
      until: undefined,
      record: { date: utc("2026-10-16"), rate: decimal(32.314) },
      expectedWhere: pair,
      expected: { date: "2026-10-16", rate: 32.314 },
    },
    {
      name: "reads the latest up to a given day",
      until: "2025-12-31",
      record: { date: utc("2025-12-31"), rate: decimal(32.79) },
      expectedWhere: { ...pair, date: { lte: utc("2025-12-31") } },
      expected: { date: "2025-12-31", rate: 32.79 },
    },
    { name: "nothing stored", until: undefined, record: null, expectedWhere: pair, expected: null },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.exchangeRate.findFirst.mockResolvedValue(tt.record);

      await expect(findLatestRate(tt.until)).resolves.toEqual(tt.expected);
      expect(prismaMock.exchangeRate.findFirst).toHaveBeenCalledWith({
        where: tt.expectedWhere,
        select: rateSelect,
        orderBy: { date: "desc" },
      });
    });
  }
});

describe("saveRates", () => {
  const tests = [
    {
      name: "stores the rates, skipping days already stored",
      rates: [
        { date: "2026-10-15", rate: 32.2 },
        { date: "2026-10-16", rate: 32.314 },
      ],
      expectedData: [
        { ...pair, date: utc("2026-10-15"), rate: 32.2 },
        { ...pair, date: utc("2026-10-16"), rate: 32.314 },
      ],
    },
    { name: "writes nothing for no rates", rates: [], expectedData: null },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      await saveRates(tt.rates);

      if (tt.expectedData === null) {
        expect(prismaMock.exchangeRate.createMany).not.toHaveBeenCalled();
      } else {
        expect(prismaMock.exchangeRate.createMany).toHaveBeenCalledWith({
          data: tt.expectedData,
          skipDuplicates: true,
        });
      }
    });
  }
});

describe("findSync", () => {
  const tests = [
    {
      name: "converts the stored record",
      record: { syncedOn: utc("2026-10-18"), complete: false },
      expected: { syncedOn: "2026-10-18", complete: false },
    },
    { name: "year never synced", record: null, expected: null },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      prismaMock.exchangeRateSync.findUnique.mockResolvedValue(tt.record);

      await expect(findSync(2026)).resolves.toEqual(tt.expected);
      expect(prismaMock.exchangeRateSync.findUnique).toHaveBeenCalledWith({
        where: { base_quote_year: { ...pair, year: 2026 } },
        select: { syncedOn: true, complete: true },
      });
    });
  }
});

describe("saveSync", () => {
  const tests = [
    { name: "records an incomplete year", sync: { syncedOn: "2026-10-19", complete: false } },
    { name: "records a complete year", sync: { syncedOn: "2027-01-08", complete: true } },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      await saveSync(2026, tt.sync);

      const data = { syncedOn: utc(tt.sync.syncedOn), complete: tt.sync.complete };
      expect(prismaMock.exchangeRateSync.upsert).toHaveBeenCalledWith({
        where: { base_quote_year: { ...pair, year: 2026 } },
        create: { ...pair, year: 2026, ...data },
        update: data,
      });
    });
  }
});
