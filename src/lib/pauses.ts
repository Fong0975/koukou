import type { PauseDto } from "@/types/dto";

type PauseDates = Pick<PauseDto, "startDate" | "endDate">;

/**
 * Finds the pause covering a day.
 *
 * @param pauses - The subscription's pauses.
 * @param dateKey - The day as "YYYY-MM-DD".
 * @returns The pause whose start and end dates (both included) hold the day, or undefined.
 */
export function pauseOn<T extends PauseDates>(pauses: T[], dateKey: string): T | undefined {
  return pauses.find((pause) => pause.startDate <= dateKey && dateKey <= pause.endDate);
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
