import { z } from "zod";
import { optionalText, requiredText } from "./common";

/** Payload for creating a category. */
export const categoryInputSchema = z.object({
  name: requiredText("類型名稱", 50),
  icon: optionalText("圖示", 16),
});

export type CategoryInput = z.input<typeof categoryInputSchema>;
export type CategoryData = z.output<typeof categoryInputSchema>;
