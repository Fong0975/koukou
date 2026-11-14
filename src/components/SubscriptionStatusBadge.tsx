import { formatSubscriptionStatus } from "@/lib/format/subscription";
import type { SubscriptionStatus } from "@/lib/subscriptionStatus";

/**
 * Pill telling that a subscription is paused until a day or has ended.
 *
 * @param props.status - The subscription's status.
 */
export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const tone = status.kind === "paused" ? "bg-coin-100/90 text-coin-600" : "bg-berry/10 text-berry";
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-sm ${tone}`}>
      {formatSubscriptionStatus(status)}
    </span>
  );
}
