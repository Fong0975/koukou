import { addDays, toDateKey, todayKey } from "@/lib/dateKey";
import { UpstreamError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import type { ExchangeRateDto } from "@/types/dto";
import { findLatestRate, findRates, findSync, saveRates, saveSync } from "./exchangeRateStore";
import { fetchDailyRates, fetchLatestRate } from "./frankfurterClient";

const logger = createLogger("exchangeRateService");

/** Days after a year ends by which its last rates are surely published, so the year counts as complete. */
const SETTLE_DAYS = 7;

const yearStart = (year: number) => toDateKey({ year, month: 1, day: 1 });
const yearEnd = (year: number) => toDateKey({ year, month: 12, day: 31 });

/**
 * Finds the first day of a year after its last stored rate.
 *
 * @param year - The calendar year.
 * @returns The day after the last stored rate, or January 1 when the year has none.
 */
async function nextMissingDay(year: number): Promise<string> {
  const last = await findLatestRate(yearEnd(year));
  return last && last.date >= yearStart(year) ? addDays(last.date, 1) : yearStart(year);
}

/**
 * Fetches the rates of a year published since its last fetch and stores them. Runs at most once a day, and
 * never again once the year is complete. A failed fetch is logged and leaves the year to be retried later.
 *
 * @param year - The calendar year.
 * @param today - Today's "YYYY-MM-DD" key.
 */
async function syncYear(year: number, today: string): Promise<void> {
  const sync = await findSync(year);
  if (sync && (sync.complete || sync.syncedOn === today)) return;

  // A year never synced may still hold the single latest rate stored when nothing else was available, so it
  // is fetched in full rather than from the day after that rate.
  const from = sync ? await nextMissingDay(year) : yearStart(year);
  const to = yearEnd(year);
  let rates: ExchangeRateDto[] = [];
  try {
    if (from <= to) rates = await fetchDailyRates(from, to);
  } catch (error) {
    if (!(error instanceof UpstreamError)) throw error;
    logger.warn("Exchange rates could not be refreshed; using stored rates", { year });
    return;
  }
  await saveRates(rates);
  await saveSync(year, { syncedOn: today, complete: today >= addDays(to, SETTLE_DAYS) });
}

/**
 * Reads the most recent stored rate, fetching and storing the latest published one when none is stored.
 *
 * @throws UpstreamError when nothing is stored and the latest rate cannot be fetched.
 */
async function getLatestRate(): Promise<ExchangeRateDto> {
  const stored = await findLatestRate();
  if (stored) return stored;
  const latest = await fetchLatestRate();
  await saveRates([latest]);
  return latest;
}

/**
 * Lists the USD→TWD rates needed to convert one year's charges. Rates are served from the database, which is
 * topped up with newly published days at most once a day. The days that already have a rate get it; later
 * days fall back to the last entry, which is the latest published rate. A year entirely in the future has no
 * daily rates, so the latest rate stands in for all of it.
 *
 * @param year - The calendar year.
 * @returns At least one rate, ordered by date.
 * @throws UpstreamError when the rates cannot be fetched and none are stored.
 */
export async function getYearRates(year: number): Promise<ExchangeRateDto[]> {
  const today = todayKey();
  const currentYear = Number(today.slice(0, 4));
  if (year > currentYear) {
    await syncYear(currentYear, today);
  } else {
    await syncYear(year, today);
    const rates = await findRates(yearStart(year), yearEnd(year));
    if (rates.length > 0) return rates;
  }
  return [await getLatestRate()];
}
