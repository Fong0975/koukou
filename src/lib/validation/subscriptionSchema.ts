import { z } from "zod";
import { Currency } from "@/generated/prisma/enums";
import { amountPeriodsSchema } from "./amountPeriodSchema";
import { amountSchema } from "./amountSchema";
import { optionalDate, optionalText, requiredDate, requiredId, requiredText, type IssueSink } from "./common";
import { checkExpiryReminders, remindersSchema } from "./reminderSchema";
import { schedulesSchema } from "./scheduleSchema";

/** Fields of a subscription payload, without the checks between its dates. */
export const subscriptionFieldsSchema = z.object({
  name: requiredText("項目名稱", 100),
  categoryId: requiredId("類型"),
  paymentMethodId: requiredId("扣款方式"),
  currency: z.enum(Currency, { error: "幣別只支援台幣或美金" }).default(Currency.TWD),
  amount: amountSchema,
  amortize: z.boolean({ error: "均攤設定格式錯誤" }).default(false),
  startDate: requiredDate("起始日"),
  contractEndDate: optionalDate("合約到期日"),
  amountPeriods: amountPeriodsSchema,
  note: optionalText("備註", 255),
  schedules: schedulesSchema,
  reminders: remindersSchema,
});

/** The dates of a subscription that must not fall before its start date. */
interface SubscriptionDates {
  startDate: string;
  contractEndDate: string | null;
  amountPeriods: { endDate: string }[];
}

/**
 * Reports a contract end date or a past amount's end date that falls before the start date.
 *
 * @param data - The parsed subscription.
 * @param ctx - Where the issues are reported.
 */
export function checkSubscriptionDates(data: SubscriptionDates, ctx: IssueSink): void {
  if (data.contractEndDate !== null && data.contractEndDate < data.startDate) {
    ctx.addIssue({ code: "custom", path: ["contractEndDate"], message: "合約到期日不可早於起始日" });
  }
  data.amountPeriods.forEach((period, index) => {
    if (period.endDate < data.startDate) {
      ctx.addIssue({ code: "custom", path: ["amountPeriods", index, "endDate"], message: "到期日不可早於起始日" });
    }
  });
}

/**
 * Runs every check between the fields of a subscription. Used as a `superRefine` of every schema
 * built on {@link subscriptionFieldsSchema}.
 *
 * @param data - The parsed subscription.
 * @param ctx - Where the issues are reported.
 */
export function checkSubscription(data: z.output<typeof subscriptionFieldsSchema>, ctx: IssueSink): void {
  checkSubscriptionDates(data, ctx);
  checkExpiryReminders(data, ctx);
}

/** Payload for creating or fully updating a subscription. */
export const subscriptionInputSchema = subscriptionFieldsSchema.superRefine(checkSubscription);

export type SubscriptionInput = z.input<typeof subscriptionInputSchema>;
export type SubscriptionData = z.output<typeof subscriptionInputSchema>;
