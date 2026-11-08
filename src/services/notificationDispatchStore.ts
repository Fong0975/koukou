import type { DispatchStatus } from "@/generated/prisma/enums";
import { dateKeyToUtcDate } from "@/lib/dateKey";
import { prisma } from "@/lib/db";

/** Outcome of one day's reminder message. */
export interface Dispatch {
  status: DispatchStatus;
  /** How many times sending was tried. */
  attempts: number;
}

/** Longest error kept with a dispatch, matching its VARCHAR(255) column. */
const MAX_ERROR_LENGTH = 255;

/**
 * Reads the outcome of a day's reminder message.
 *
 * @param date - The day, "YYYY-MM-DD".
 * @returns The outcome, or null when nothing was tried that day.
 */
export async function findDispatch(date: string): Promise<Dispatch | null> {
  return prisma.notificationDispatch.findUnique({
    where: { date: dateKeyToUtcDate(date) },
    select: { status: true, attempts: true },
  });
}

/**
 * Marks a day as having nothing to send, unless something was already tried that day.
 *
 * @param date - The day, "YYYY-MM-DD".
 */
export async function skipDayIfUntried(date: string): Promise<void> {
  const key = dateKeyToUtcDate(date);
  await prisma.notificationDispatch.upsert({
    where: { date: key },
    create: { date: key, status: "SKIPPED", attempts: 0 },
    update: {},
  });
}

/**
 * Records the outcome of a day's reminder message, replacing an earlier one.
 *
 * @param date - The day, "YYYY-MM-DD".
 * @param dispatch - The outcome.
 * @param lastError - Why the last try failed, or null; cut to the column length.
 */
export async function saveDispatch(date: string, dispatch: Dispatch, lastError: string | null = null): Promise<void> {
  const data = { ...dispatch, lastError: lastError?.slice(0, MAX_ERROR_LENGTH) ?? null };
  const key = dateKeyToUtcDate(date);
  await prisma.notificationDispatch.upsert({ where: { date: key }, create: { date: key, ...data }, update: data });
}
