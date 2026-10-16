import { z } from "zod";

/** Max days per month (index 0 = January); February allows 29 to cover leap years. */
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const int = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label}格式錯誤` })
    .int(`${label}必須為整數`)
    .min(min, `${label}需介於 ${min}–${max}`)
    .max(max, `${label}需介於 ${min}–${max}`);

const dayOfWeek = int("星期", 0, 6);
const dayOfMonth = int("日期", 1, 31);
const month = int("月份", 1, 12);

/**
 * A single billing rule. The required day fields depend on `cycle`; the output is
 * normalized so every field is present (unused ones are null), matching the DB columns.
 */
export const scheduleSchema = z
  .discriminatedUnion(
    "cycle",
    [
      z.object({ cycle: z.literal("DAILY") }),
      z.object({ cycle: z.literal("WEEKLY"), dayOfWeek }),
      z.object({ cycle: z.literal("MONTHLY"), dayOfMonth }),
      z.object({ cycle: z.literal("YEARLY"), month, dayOfMonth }),
    ],
    { error: "請選擇扣款週期" },
  )
  .superRefine((schedule, ctx) => {
    if (schedule.cycle === "YEARLY" && schedule.dayOfMonth > DAYS_IN_MONTH[schedule.month - 1]) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfMonth"],
        message: `${schedule.month} 月沒有 ${schedule.dayOfMonth} 日`,
      });
    }
  })
  .transform((schedule) => ({
    cycle: schedule.cycle,
    dayOfWeek: "dayOfWeek" in schedule ? schedule.dayOfWeek : null,
    dayOfMonth: "dayOfMonth" in schedule ? schedule.dayOfMonth : null,
    month: "month" in schedule ? schedule.month : null,
  }));

export type ScheduleInput = z.input<typeof scheduleSchema>;
export type ScheduleData = z.output<typeof scheduleSchema>;

/**
 * Builds a stable identity key used to detect duplicate schedules.
 *
 * @param schedule - A normalized schedule.
 * @returns A string uniquely identifying the billing rule.
 */
export function scheduleKey(schedule: ScheduleData): string {
  return [schedule.cycle, schedule.dayOfWeek, schedule.dayOfMonth, schedule.month].join("|");
}

/** One or more distinct billing rules. */
export const schedulesSchema = z
  .array(scheduleSchema, { error: "請設定扣款週期" })
  .min(1, "至少需要一個扣款週期")
  .max(20, "扣款週期最多 20 個")
  .refine((schedules) => new Set(schedules.map(scheduleKey)).size === schedules.length, "扣款週期不可重複");
