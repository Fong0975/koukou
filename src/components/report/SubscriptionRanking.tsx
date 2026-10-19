import type { RankedSubscription } from "@/lib/yearReport";
import { ConvertedAmounts } from "../ConvertedAmounts";
import { IconLabel } from "../IconLabel";

/**
 * Subscriptions ranked by what they charged over the year, each with its category, charge count, total and a
 * bar relative to the most expensive one.
 *
 * @param props.ranking - The ranked subscriptions, most expensive first.
 */
export function SubscriptionRanking({ ranking }: { ranking: RankedSubscription[] }) {
  return (
    <ol aria-label="項目排行" className="flex flex-col gap-3">
      {ranking.map(({ subscription, count, totals, twdCents, share }, index) => (
        <li key={subscription.id} className="text-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 break-words">
              <span className="mr-2 inline-block w-5 font-num text-ink-soft tabular-nums">{index + 1}</span>
              {subscription.name}
              <span className="ml-2 text-xs text-ink-soft">
                <IconLabel icon={subscription.category.icon} label={subscription.category.name} />・{count} 次
              </span>
            </span>
            <ConvertedAmounts totals={totals} twdCents={twdCents} layout="popup" />
          </div>
          <div aria-hidden="true" className="mt-1.5 ml-7 h-1.5 rounded-full bg-leaf-100">
            <div className="h-full rounded-full bg-leaf-500" style={{ width: `${share * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
