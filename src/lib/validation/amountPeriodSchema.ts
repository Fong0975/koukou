import { z } from "zod";
import { amountSchema } from "./amountSchema";
import { duplicateIndexes, requiredDate } from "./common";

/** Most past amounts one subscription may keep. */
export const MAX_AMOUNT_PERIODS = 120;

/** A past amount that applied up to and including `endDate`. */
export const amountPeriodSchema = z.object({
  amount: amountSchema,
  endDate: requiredDate("到期日"),
});

export type AmountPeriodInput = z.input<typeof amountPeriodSchema>;
export type AmountPeriodData = z.output<typeof amountPeriodSchema>;

/**
 * Past amounts of a subscription, in any order; each end date may appear only once
 * because the periods are ordered and told apart by it.
 */
export const amountPeriodsSchema = z
  .array(amountPeriodSchema, { error: "金額紀錄格式錯誤" })
  .max(MAX_AMOUNT_PERIODS, `金額紀錄最多 ${MAX_AMOUNT_PERIODS} 筆`)
  .superRefine((periods, ctx) => {
    for (const index of duplicateIndexes(periods, (period) => period.endDate)) {
      ctx.addIssue({ code: "custom", path: [index, "endDate"], message: "到期日不可重複" });
    }
  })
  .default([]);
