import { z } from "zod";
import { Currency } from "@/generated/prisma/enums";
import { amountPeriodsSchema } from "./amountPeriodSchema";
import { amountSchema } from "./amountSchema";
import { optionalText, requiredDate, requiredId, requiredText } from "./common";
import { schedulesSchema } from "./scheduleSchema";

/** Payload for creating or fully updating a subscription. */
export const subscriptionInputSchema = z
  .object({
    name: requiredText("項目名稱", 100),
    categoryId: requiredId("類型"),
    paymentMethodId: requiredId("扣款方式"),
    currency: z.enum(Currency, { error: "幣別只支援台幣或美金" }).default(Currency.TWD),
    amount: amountSchema,
    startDate: requiredDate("起始日"),
    amountPeriods: amountPeriodsSchema,
    note: optionalText("備註", 255),
    schedules: schedulesSchema,
  })
  .superRefine((data, ctx) => {
    data.amountPeriods.forEach((period, index) => {
      if (period.endDate < data.startDate) {
        ctx.addIssue({
          code: "custom",
          path: ["amountPeriods", index, "endDate"],
          message: "到期日不可早於起始日",
        });
      }
    });
  });

export type SubscriptionInput = z.input<typeof subscriptionInputSchema>;
export type SubscriptionData = z.output<typeof subscriptionInputSchema>;
