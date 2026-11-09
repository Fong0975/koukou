import { z } from "zod";
import { optionalText, orderedIds, requiredText } from "./common";

/** Payload for creating or editing a category. */
export const categoryInputSchema = z.object({
  name: requiredText("類型名稱", 50),
  icon: optionalText("圖示", 16),
});

/** Payload for reordering categories: every category id, first to last. */
export const categoryOrderSchema = z.object({ ids: orderedIds("類型") });

export type CategoryInput = z.input<typeof categoryInputSchema>;
export type CategoryData = z.output<typeof categoryInputSchema>;
export type CategoryOrderData = z.output<typeof categoryOrderSchema>;
