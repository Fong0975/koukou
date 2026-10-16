import { z } from "zod";
import { PaymentType } from "@/generated/prisma/enums";
import { optionalText, requiredText } from "./common";

/** Payload for creating a payment method, e.g. a credit card named "國泰 CUBE". */
export const paymentMethodInputSchema = z.object({
  type: z.enum(PaymentType, { error: "請選擇扣款方式" }),
  name: requiredText("卡片/帳戶名稱", 100),
  note: optionalText("備註", 255),
});

export type PaymentMethodInput = z.input<typeof paymentMethodInputSchema>;
export type PaymentMethodData = z.output<typeof paymentMethodInputSchema>;
