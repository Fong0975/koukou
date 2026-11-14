import { localClockTime } from "../dateKey";

/**
 * Tells whether a day's send time has come, in the local (server) time zone.
 *
 * @param now - The current time.
 * @param sendTime - "HH:mm" on a 24-hour clock.
 * @returns True from the send time to the end of the day.
 */
export function isSendTimeReached(now: Date, sendTime: string): boolean {
  return localClockTime(now) >= sendTime;
}
