import type { DispatchKind } from "@/generated/prisma/enums";
import { createLogger } from "@/lib/logger";
import { pushText } from "./lineClient";
import { saveDispatch, type Dispatch } from "./notificationDispatchStore";

const logger = createLogger("reminderDelivery");

/** Most tries at sending one message before giving up on it. */
export const MAX_SEND_ATTEMPTS = 3;

/** What handling one message did. */
export type DeliveryResult =
  /** Today has nothing to report in this message, so nothing was sent. */
  | "skipped"
  | "sent"
  /** Sending failed; a later run tries again until {@link MAX_SEND_ATTEMPTS}. */
  | "failed";

/**
 * Tells whether a message still has to be handled today: it was never tried, or its last try failed
 * and tries are left.
 *
 * @param previous - The message's recorded outcome, or null when it was never tried.
 */
export function isPending(previous: Dispatch | null): boolean {
  return previous === null || (previous.status === "FAILED" && previous.attempts < MAX_SEND_ATTEMPTS);
}

/**
 * Sends one of a day's messages and records the outcome, so a retry never repeats a message that
 * already went out.
 *
 * @param date - The day, "YYYY-MM-DD".
 * @param kind - Which of the day's messages this is.
 * @param message - The text to send, or null when there is nothing to report.
 * @param previous - The message's earlier outcome, or null when it was never tried.
 * @returns What was done.
 */
export async function deliverMessage(
  date: string,
  kind: DispatchKind,
  message: string | null,
  previous: Dispatch | null,
): Promise<DeliveryResult> {
  const attempts = (previous?.attempts ?? 0) + 1;
  if (message === null) {
    await saveDispatch(date, kind, { status: "SKIPPED", attempts: previous?.attempts ?? 0 });
    logger.info("Nothing to report", { date, kind });
    return "skipped";
  }

  try {
    await pushText(message);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await saveDispatch(date, kind, { status: "FAILED", attempts }, reason);
    logger.error("Reminder message failed", { date, kind, attempts }, error);
    return "failed";
  }
  await saveDispatch(date, kind, { status: "SENT", attempts });
  logger.info("Reminder message sent", { date, kind, attempts });
  return "sent";
}
