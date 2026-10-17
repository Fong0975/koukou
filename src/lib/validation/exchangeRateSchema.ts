import { z } from "zod";

/** First year the exchange rate service has USD→TWD data for. */
export const MIN_RATE_YEAR = 1999;

const INVALID_YEAR = "年份格式錯誤";

/** Query of `GET /api/exchange-rates`. */
export const exchangeRateQuerySchema = z.object({
  year: z
    .string({ error: INVALID_YEAR })
    .regex(/^\d{4}$/, INVALID_YEAR)
    .transform(Number)
    .pipe(z.number().min(MIN_RATE_YEAR, `僅支援 ${MIN_RATE_YEAR} 年以後的匯率`)),
});
