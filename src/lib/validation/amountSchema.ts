import { z } from "zod";

/** Upper bound of a DECIMAL(12, 2) column. */
const MAX_AMOUNT = 9_999_999_999.99;

/**
 * Non-negative money amount with at most two decimals that fits a DECIMAL(12, 2) column.
 * Zero is allowed so a free period, such as a trial, can be recorded.
 */
export const amountSchema = z.coerce
  .number({ error: "請輸入金額" })
  .nonnegative("金額不可小於 0")
  .max(MAX_AMOUNT, "金額過大")
  // Compare with a tolerance because values like 19.99 * 100 are not exact in floating point.
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, "金額最多兩位小數");
