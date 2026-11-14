import type { DispatchKind, DispatchStatus } from "@/generated/prisma/enums";
import { dateKeyToUtcDate } from "@/lib/date/dateKey";
import { prisma } from "@/lib/db";

/** Outcome of one of a day's messages. */
export interface Dispatch {
  status: DispatchStatus;
  /** How many times sending was tried. */
  attempts: number;
}

/** Longest error kept with a dispatch, matching its VARCHAR(255) column. */
const MAX_ERROR_LENGTH = 255;

/** Every kind of message a day can hold. */
const DISPATCH_KINDS: DispatchKind[] = ["SUMMARY", "DAILY"];

/**
 * Reads the outcome of one of a day's messages.
 *
 * @param date - The day, "YYYY-MM-DD".
 * @param kind - Which of the day's messages.
 * @returns The outcome, or null when that message was not tried that day.
 */
export async function findDispatch(date: string, kind: DispatchKind): Promise<Dispatch | null> {
  return prisma.notificationDispatch.findUnique({
    where: { date_kind: { date: dateKeyToUtcDate(date), kind } },
    select: { status: true, attempts: true },
  });
}

/**
 * Marks every message of a day as having nothing to send, unless it was already tried that day.
 *
 * @param date - The day, "YYYY-MM-DD".
 */
export async function skipDayIfUntried(date: string): Promise<void> {
  const key = dateKeyToUtcDate(date);
  await Promise.all(
    DISPATCH_KINDS.map((kind) =>
      prisma.notificationDispatch.upsert({
        where: { date_kind: { date: key, kind } },
        create: { date: key, kind, status: "SKIPPED", attempts: 0 },
        update: {},
      }),
    ),
  );
}

/**
 * Records the outcome of one of a day's messages, replacing an earlier one.
 *
 * @param date - The day, "YYYY-MM-DD".
 * @param kind - Which of the day's messages.
 * @param dispatch - The outcome.
 * @param lastError - Why the last try failed, or null; cut to the column length.
 */
export async function saveDispatch(
  date: string,
  kind: DispatchKind,
  dispatch: Dispatch,
  lastError: string | null = null,
): Promise<void> {
  const data = { ...dispatch, lastError: lastError?.slice(0, MAX_ERROR_LENGTH) ?? null };
  const key = dateKeyToUtcDate(date);
  await prisma.notificationDispatch.upsert({
    where: { date_kind: { date: key, kind } },
    create: { date: key, kind, ...data },
    update: data,
  });
}
