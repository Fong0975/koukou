import { z } from "zod";
import { optionalText, requiredId, requiredText } from "./common";

/** Payload for creating or editing a category. */
export const categoryInputSchema = z.object({
  name: requiredText("類型名稱", 50),
  icon: optionalText("圖示", 16),
});

/** Payload for reordering categories: every category id, first to last. */
export const categoryOrderSchema = z.object({
  ids: z.array(requiredId("類型")).min(1, "請提供類型排序"),
});

export type CategoryInput = z.input<typeof categoryInputSchema>;
export type CategoryData = z.output<typeof categoryInputSchema>;
export type CategoryOrderData = z.output<typeof categoryOrderSchema>;
