import { z } from "zod";
import { Currency } from "@/generated/prisma/enums";
import { optionalText, requiredId, requiredText } from "./common";
import { schedulesSchema } from "./scheduleSchema";

/** Upper bound of a DECIMAL(12, 2) column. */
export const MAX_AMOUNT = 9_999_999_999.99;

const amountSchema = z.coerce
  .number({ error: "請輸入金額" })
  .positive("金額必須大於 0")
  .max(MAX_AMOUNT, "金額過大")
  // Compare with a tolerance because values like 19.99 * 100 are not exact in floating point.
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, "金額最多兩位小數");

/** Payload for creating or fully updating a subscription. */
export const subscriptionInputSchema = z.object({
  name: requiredText("項目名稱", 100),
  categoryId: requiredId("類型"),
  paymentMethodId: requiredId("扣款方式"),
  currency: z.enum(Currency, { error: "幣別只支援台幣或美金" }).default(Currency.TWD),
  amount: amountSchema,
  note: optionalText("備註", 255),
  schedules: schedulesSchema,
});

export type SubscriptionInput = z.input<typeof subscriptionInputSchema>;
export type SubscriptionData = z.output<typeof subscriptionInputSchema>;
