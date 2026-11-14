import type { SubscriptionDto } from "@/types/dto";
import { pauseOn } from "./pauses";

/** Why a subscription does not charge on a day. */
export type SubscriptionStatus =
  /** Paused through `until` ("YYYY-MM-DD"); charges again the day after. */
  | { kind: "paused"; until: string }
  /** Ended on `endDate` ("YYYY-MM-DD"), its last charging day; nothing is charged after it. */
  | { kind: "ended"; endDate: string };

/**
 * Tells whether a subscription has ended or is paused on a day. Its end date itself still charges, so it
 * only counts as ended from the day after.
 *
 * @param subscription - The subscription.
 * @param dateKey - The day as "YYYY-MM-DD", usually today.
 * @returns The status, or null when the subscription runs that day.
 */
export function subscriptionStatusOn(
  subscription: Pick<SubscriptionDto, "contractEndDate" | "pauses">,
  dateKey: string,
): SubscriptionStatus | null {
  const { contractEndDate } = subscription;
  if (contractEndDate !== null && dateKey > contractEndDate) return { kind: "ended", endDate: contractEndDate };
  const pause = pauseOn(subscription.pauses, dateKey);
  return pause === undefined ? null : { kind: "paused", until: pause.endDate };
}

/** A subscription that is paused or has ended, with its status. */
interface StoppedSubscription {
  item: SubscriptionDto;
  status: SubscriptionStatus;
}

/**
 * Splits subscriptions into those running on a day and those paused or ended that day.
 *
 * @param items - The subscriptions.
 * @param dateKey - The day as "YYYY-MM-DD", usually today; null keeps every subscription running, e.g. before
 *   the browser's date is known.
 * @returns The running ones in input order, and the stopped ones with paused before ended, each by name.
 */
export function splitByStatus(
  items: SubscriptionDto[],
  dateKey: string | null,
): { running: SubscriptionDto[]; stopped: StoppedSubscription[] } {
  const running: SubscriptionDto[] = [];
  const stopped: StoppedSubscription[] = [];
  for (const item of items) {
    const status = dateKey === null ? null : subscriptionStatusOn(item, dateKey);
    if (status === null) running.push(item);
    else stopped.push({ item, status });
  }
  const kindRank = (status: SubscriptionStatus) => (status.kind === "paused" ? 0 : 1);
  stopped.sort((a, b) => kindRank(a.status) - kindRank(b.status) || a.item.name.localeCompare(b.item.name));
  return { running, stopped };
}
