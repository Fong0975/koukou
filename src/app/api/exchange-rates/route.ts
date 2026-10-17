import { jsonData, withErrorHandling } from "@/lib/http/apiResponse";
import { exchangeRateQuerySchema } from "@/lib/validation/exchangeRateSchema";
import { getYearRates } from "@/services/exchangeRateService";

/** GET /api/exchange-rates?year=2026 — lists the USD→TWD rates for converting that year's charges. */
export const GET = withErrorHandling(async (request) => {
  const { year } = exchangeRateQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return jsonData(await getYearRates(year));
});
