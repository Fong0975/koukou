import { z } from "zod";
import { optionalText, orderedIds, requiredText } from "./common";

const EMOJI_MODIFIER = String.raw`(?:️|\p{Emoji_Modifier})?`;
const PICTOGRAPH = String.raw`\p{Extended_Pictographic}${EMOJI_MODIFIER}`;

/** Exactly one emoji: a flag, or a pictograph with optional modifiers and ZWJ-joined parts. */
const SINGLE_EMOJI = new RegExp(String.raw`^(?:\p{Regional_Indicator}{2}|${PICTOGRAPH}(?:‍${PICTOGRAPH})*)$`, "u");

/** Payload for creating or editing a category. */
export const categoryInputSchema = z.object({
  name: requiredText("類型名稱", 50),
  icon: optionalText("圖示", 16).refine(
    (value) => value === null || SINGLE_EMOJI.test(value),
    "圖示只能是單一個 emoji",
  ),
});

/** Payload for reordering categories: every category id, first to last. */
export const categoryOrderSchema = z.object({ ids: orderedIds("類型") });

export type CategoryInput = z.input<typeof categoryInputSchema>;
export type CategoryData = z.output<typeof categoryInputSchema>;
