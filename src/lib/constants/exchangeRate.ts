import type { Currency } from "@/generated/prisma/enums";

/**
 * USD is the base so each rate reads as TWD per 1 USD, like a bank's quote, and a USD amount converts by
 * multiplication. The inverse pair is published with fewer significant digits and would lose precision.
 */
export const RATE_BASE: Currency = "USD";

/** Currency the rates are quoted in. */
export const RATE_QUOTE: Currency = "TWD";
