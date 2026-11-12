import { formatPauseStatus } from "@/lib/format";
import type { PauseStatus } from "@/lib/pauses";

/**
 * Pill telling that a subscription is paused until a day or cancelled since a day.
 *
 * @param props.status - The subscription's pause status.
 */
export function PauseStatusBadge({ status }: { status: PauseStatus }) {
  const tone = status.kind === "paused" ? "bg-coin-100/90 text-coin-600" : "bg-berry/10 text-berry";
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-sm ${tone}`}>
      {formatPauseStatus(status)}
    </span>
  );
}
