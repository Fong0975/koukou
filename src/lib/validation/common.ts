import { z } from "zod";
import { isDateKey } from "@/lib/dateKey";

/**
 * Trimmed, required text with a maximum length.
 *
 * @param label - Field name used in error messages.
 * @param max - Maximum length after trimming.
 */
export const requiredText = (label: string, max: number) =>
  z
    .string({ error: `請輸入${label}` })
    .trim()
    .min(1, `請輸入${label}`)
    .max(max, `${label}最多 ${max} 個字`);

/**
 * Optional trimmed text; blank strings are normalized to null.
 *
 * @param label - Field name used in error messages.
 * @param max - Maximum length after trimming.
 */
export const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label}最多 ${max} 個字`)
    .nullish()
    .transform((value) => (value ? value : null));

/** Largest value of the signed 32-bit INT id columns. */
export const MAX_INT_ID = 2_147_483_647;

/**
 * Reference to another record chosen from a list; accepts numeric strings from form selects.
 *
 * @param label - Name of the referenced thing, used in the "please choose" message.
 */
export const requiredId = (label: string) =>
  z.coerce
    .number({ error: `請選擇${label}` })
    .int(`請選擇${label}`)
    .positive(`請選擇${label}`)
    .max(MAX_INT_ID, `${label}不存在`);

/**
 * Required calendar date written as "YYYY-MM-DD" (the value of an `<input type="date">`).
 *
 * @param label - Field name used in error messages.
 */
export const requiredDate = (label: string) =>
  z
    .string({ error: `請輸入${label}` })
    .trim()
    .min(1, `請輸入${label}`)
    .refine(isDateKey, `${label}不是有效的日期`);
