import { createLogger } from "@/lib/logger";
import { runDailyReminder } from "./reminderService";

const logger = createLogger("reminderScheduler");

/** How often the scheduler checks whether today's message is due. */
export const CHECK_INTERVAL_MS = 60_000;

interface SchedulerState {
  timer: ReturnType<typeof setInterval>;
  /** Whether a run is still in progress, so a slow run is never overlapped by the next one. */
  running: boolean;
}

// Kept on globalThis so a module reloaded by the dev server does not start a second timer.
const store = globalThis as typeof globalThis & { reminderScheduler?: SchedulerState };

/**
 * Runs one check, skipping it while the previous one is still running. Errors are logged, never thrown,
 * so one failed check does not stop the scheduler.
 *
 * @param state - The scheduler's state.
 * @param run - The check to run.
 */
async function tick(state: Pick<SchedulerState, "running">, run: typeof runDailyReminder): Promise<void> {
  if (state.running) return;
  state.running = true;
  try {
    await run(new Date());
  } catch (error) {
    logger.error("Reminder check failed", {}, error);
  } finally {
    state.running = false;
  }
}

/**
 * Starts checking every {@link CHECK_INTERVAL_MS} whether today's reminder message is due, with a
 * first check right away. Does nothing when already started.
 *
 * @param run - The check to run; the real reminder run by default.
 * @returns Whether the scheduler was started by this call.
 */
export function startReminderScheduler(run: typeof runDailyReminder = runDailyReminder): boolean {
  if (store.reminderScheduler) return false;
  const state: SchedulerState = { running: false, timer: setInterval(() => void tick(state, run), CHECK_INTERVAL_MS) };
  // Never keep the process alive just for the timer.
  state.timer.unref?.();
  store.reminderScheduler = state;
  logger.info("Reminder scheduler started", { intervalMs: CHECK_INTERVAL_MS });
  void tick(state, run);
  return true;
}

/**
 * Stops the scheduler; a check already running finishes on its own.
 */
export function stopReminderScheduler(): void {
  const state = store.reminderScheduler;
  if (!state) return;
  clearInterval(state.timer);
  delete store.reminderScheduler;
}
