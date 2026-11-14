import { z } from "zod";
import { isDateKey } from "@/lib/date/dateKey";

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
 * A non-empty list of record ids in their desired display order, for reorder requests.
 *
 * @param label - Name of the records, used in error messages.
 */
export const orderedIds = (label: string) => z.array(requiredId(label)).min(1, `請提供${label}排序`);

/** Message shown when a date field holds something other than a real "YYYY-MM-DD" date. */
const invalidDateMessage = (label: string) => `${label}不是有效的日期`;

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
    .refine(isDateKey, invalidDateMessage(label));

/**
 * Optional calendar date written as "YYYY-MM-DD"; blank strings are normalized to null.
 *
 * @param label - Field name used in error messages.
 */
export const optionalDate = (label: string) =>
  z
    .string({ error: invalidDateMessage(label) })
    .trim()
    .nullish()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || isDateKey(value), invalidDateMessage(label));

/** The part of a zod refinement context that cross-field checks report through. */
export interface IssueSink {
  addIssue(issue: { code: "custom"; path: (string | number)[]; message: string }): void;
}

/**
 * Finds the items whose key already appeared earlier in a list, so each repeat can be reported where it is.
 *
 * @param items - The list.
 * @param keyOf - The key that must be unique; keys are compared with `Set` semantics.
 * @returns The positions of the repeats, ascending; the first occurrence of a key is never included.
 */
export function duplicateIndexes<T>(items: readonly T[], keyOf: (item: T) => unknown): number[] {
  const seen = new Set<unknown>();
  return items.flatMap((item, index) => {
    const key = keyOf(item);
    if (seen.has(key)) return [index];
    seen.add(key);
    return [];
  });
}

/**
 * Tells whether no two items of a list share a key.
 *
 * @param items - The list.
 * @param keyOf - The key that must be unique; the item itself by default.
 */
export function isUniqueBy<T>(items: readonly T[], keyOf: (item: T) => unknown = (item) => item): boolean {
  return duplicateIndexes(items, keyOf).length === 0;
}
