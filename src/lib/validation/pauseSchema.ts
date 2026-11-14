import { z } from "zod";
import { requiredDate, type IssueSink } from "./common";

/** Most pauses one subscription may keep. */
export const MAX_PAUSES = 60;

/** Days on which a subscription is paused, both included; it charges again the day after `endDate`. */
export const pauseSchema = z.object({
  startDate: requiredDate("暫停開始日"),
  endDate: requiredDate("暫停結束日"),
});

type PauseData = z.output<typeof pauseSchema>;

/**
 * Reports each pause that ends before it starts.
 *
 * @param pauses - The parsed pauses.
 * @param ctx - Where the issues are reported, relative to the list.
 */
function checkPauseEnds(pauses: PauseData[], ctx: IssueSink): void {
  pauses.forEach((pause, index) => {
    if (pause.endDate < pause.startDate) {
      ctx.addIssue({ code: "custom", path: [index, "endDate"], message: "結束日不可早於開始日" });
    }
  });
}

/**
 * Walks the pauses by start date and reports a pause starting on or before the end of the one before it.
 *
 * @param pauses - The parsed pauses, in any order; issue paths use their positions in this list.
 * @param ctx - Where the issues are reported, relative to the list.
 */
function checkPauseOverlaps(pauses: PauseData[], ctx: IssueSink): void {
  const order = pauses.map((_, index) => index).sort((a, b) => pauses[a].startDate.localeCompare(pauses[b].startDate));
  order.slice(1).forEach((index, position) => {
    if (pauses[index].startDate <= pauses[order[position]].endDate) {
      ctx.addIssue({ code: "custom", path: [index, "startDate"], message: "暫停期間不可重疊" });
    }
  });
}

/**
 * Pauses of a subscription, in any order. Each end date must not fall before its start date, and the
 * pauses must not overlap.
 */
export const pausesSchema = z
  .array(pauseSchema, { error: "暫停期間格式錯誤" })
  .max(MAX_PAUSES, `暫停期間最多 ${MAX_PAUSES} 筆`)
  .superRefine((pauses, ctx) => {
    checkPauseEnds(pauses, ctx);
    checkPauseOverlaps(pauses, ctx);
  })
  .default([]);
