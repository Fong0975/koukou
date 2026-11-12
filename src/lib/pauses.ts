import type { PauseDto } from "@/types/dto";

type PauseDates = Pick<PauseDto, "startDate" | "endDate">;

/** Whether a subscription is paused on a day, and until when. */
export type PauseStatus =
  /** Paused through `until` ("YYYY-MM-DD"); charges again the day after. */
  | { kind: "paused"; until: string }
  /** Paused with no end date since `since` ("YYYY-MM-DD"), i.e. cancelled. */
  | { kind: "cancelled"; since: string };

/**
 * Finds the pause covering a day.
 *
 * @param pauses - The subscription's pauses.
 * @param dateKey - The day as "YYYY-MM-DD".
 * @returns The pause whose start and end dates (both included) hold the day, or undefined.
 */
function pauseOn<T extends PauseDates>(pauses: T[], dateKey: string): T | undefined {
  return pauses.find((pause) => pause.startDate <= dateKey && (pause.endDate === null || dateKey <= pause.endDate));
}

/**
 * Tells whether a day falls in one of a subscription's pauses, start and end dates included.
 *
 * @param pauses - The subscription's pauses.
 * @param dateKey - The day as "YYYY-MM-DD".
 */
export function isPausedOn(pauses: PauseDates[], dateKey: string): boolean {
  return pauseOn(pauses, dateKey) !== undefined;
}

/**
 * Tells whether a subscription is paused or cancelled on a day.
 *
 * @param subscription - The subscription.
 * @param dateKey - The day as "YYYY-MM-DD", usually today.
 * @returns The status, or null when the subscription is not paused that day.
 */
export function pauseStatusOn(subscription: { pauses: PauseDates[] }, dateKey: string): PauseStatus | null {
  const pause = pauseOn(subscription.pauses, dateKey);
  if (pause === undefined) return null;
  return pause.endDate === null
    ? { kind: "cancelled", since: pause.startDate }
    : { kind: "paused", until: pause.endDate };
}
