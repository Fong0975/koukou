import { RATE_BASE, RATE_QUOTE } from "@/lib/constants/exchangeRate";
import { dateKeyToUtcDate, utcDateToDateKey } from "@/lib/dateKey";
import { prisma } from "@/lib/db";
import type { ExchangeRateDto } from "@/types/dto";

/** Last fetch of one year's rates. */
export interface RateSync {
  /** "YYYY-MM-DD" of the day the fetch ran. */
  syncedOn: string;
  /** Whether the year had ended when it was fetched, so it never needs fetching again. */
  complete: boolean;
}

const pair = { base: RATE_BASE, quote: RATE_QUOTE } as const;

const rateSelect = { date: true, rate: true } as const;

/** Structural shape of a rate row loaded with {@link rateSelect}. */
interface RateRecord {
  date: Date;
  rate: { toNumber(): number };
}

const toRateDto = (record: RateRecord): ExchangeRateDto => ({
  date: utcDateToDateKey(record.date),
  rate: record.rate.toNumber(),
});

/**
 * Lists the stored USD→TWD rates between two days.
 *
 * @param from - First day, "YYYY-MM-DD".
 * @param to - Last day, "YYYY-MM-DD".
 * @returns The rates ordered by date.
 */
export async function findRates(from: string, to: string): Promise<ExchangeRateDto[]> {
  const records = await prisma.exchangeRate.findMany({
    where: { ...pair, date: { gte: dateKeyToUtcDate(from), lte: dateKeyToUtcDate(to) } },
    select: rateSelect,
    orderBy: { date: "asc" },
  });
  return records.map(toRateDto);
}

/**
 * Reads the most recent stored USD→TWD rate, optionally no later than a given day.
 *
 * @param until - Last day to consider, "YYYY-MM-DD"; every stored day when omitted.
 * @returns The rate, or null when none is stored.
 */
export async function findLatestRate(until?: string): Promise<ExchangeRateDto | null> {
  const record = await prisma.exchangeRate.findFirst({
    where: until === undefined ? pair : { ...pair, date: { lte: dateKeyToUtcDate(until) } },
    select: rateSelect,
    orderBy: { date: "desc" },
  });
  return record ? toRateDto(record) : null;
}

/**
 * Stores USD→TWD rates. Days already stored are skipped, since a published rate never changes.
 *
 * @param rates - The rates to store.
 */
export async function saveRates(rates: ExchangeRateDto[]): Promise<void> {
  if (rates.length === 0) return;
  await prisma.exchangeRate.createMany({
    data: rates.map(({ date, rate }) => ({ ...pair, date: dateKeyToUtcDate(date), rate })),
    skipDuplicates: true,
  });
}

/**
 * Reads when one year's USD→TWD rates were last fetched.
 *
 * @param year - The calendar year.
 * @returns The sync record, or null when the year was never fetched.
 */
export async function findSync(year: number): Promise<RateSync | null> {
  const record = await prisma.exchangeRateSync.findUnique({
    where: { base_quote_year: { ...pair, year } },
    select: { syncedOn: true, complete: true },
  });
  return record ? { syncedOn: utcDateToDateKey(record.syncedOn), complete: record.complete } : null;
}

/**
 * Records a fetch of one year's USD→TWD rates.
 *
 * @param year - The calendar year.
 * @param sync - When it ran and whether the year is now complete.
 */
export async function saveSync(year: number, { syncedOn, complete }: RateSync): Promise<void> {
  const data = { syncedOn: dateKeyToUtcDate(syncedOn), complete };
  await prisma.exchangeRateSync.upsert({
    where: { base_quote_year: { ...pair, year } },
    create: { ...pair, year, ...data },
    update: data,
  });
}
