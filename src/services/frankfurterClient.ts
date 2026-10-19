import { z } from "zod";
import { RATE_BASE, RATE_QUOTE } from "@/lib/constants/exchangeRate";
import { UpstreamError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import type { ExchangeRateDto } from "@/types/dto";

const logger = createLogger("services/frankfurterClient");

const BASE_URL = "https://api.frankfurter.dev/v2";
const UPSTREAM_MESSAGE = "無法取得匯率，請稍後再試";

const rateSchema = z.object({ date: z.string(), rate: z.number().positive() });

/**
 * Fetches a Frankfurter endpoint and validates its JSON body.
 *
 * @param url - The endpoint URL.
 * @param schema - Expected shape of the body.
 * @throws UpstreamError when the request fails, answers with an error status or returns an unexpected body.
 */
async function getJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    body = await response.json();
  } catch (error) {
    logger.warn("Exchange rate request failed", { url }, error);
    throw new UpstreamError(UPSTREAM_MESSAGE);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    logger.warn("Exchange rate response has an unexpected shape", { url }, parsed.error);
    throw new UpstreamError(UPSTREAM_MESSAGE);
  }
  return parsed.data;
}

/**
 * Fetches the USD→TWD rates published between two days. Days without a publication are absent, and a range
 * entirely in the future returns nothing.
 *
 * @param from - First day, "YYYY-MM-DD".
 * @param to - Last day, "YYYY-MM-DD".
 * @returns The rates in the order the service returns them.
 * @throws UpstreamError when the service cannot be reached or answers unexpectedly.
 */
export async function fetchDailyRates(from: string, to: string): Promise<ExchangeRateDto[]> {
  const query = new URLSearchParams({ base: RATE_BASE, quotes: RATE_QUOTE, from, to });
  const rates = await getJson(`${BASE_URL}/rates?${query}`, z.array(rateSchema));
  return rates.map(({ date, rate }) => ({ date, rate }));
}

/**
 * Fetches the most recently published USD→TWD rate.
 *
 * @throws UpstreamError when the service cannot be reached or answers unexpectedly.
 */
export async function fetchLatestRate(): Promise<ExchangeRateDto> {
  const { date, rate } = await getJson(`${BASE_URL}/rate/${RATE_BASE}/${RATE_QUOTE}`, rateSchema);
  return { date, rate };
}
