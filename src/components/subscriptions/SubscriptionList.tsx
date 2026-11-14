import { useId } from "react";
import type { LoadStatus } from "@/hooks/useApiResource";
import { useToday } from "@/hooks/useToday";
import { toDateKey } from "@/lib/date/dateKey";
import { groupByCategory } from "@/lib/billing/groupByCategory";
import { splitByStatus } from "@/lib/billing/subscriptionStatus";
import type { SubscriptionDto } from "@/types/dto";
import { EmptyState } from "../ui/EmptyState";
import { LoadErrorNotice } from "../ui/LoadErrorNotice";
import { SubscriptionCard } from "./SubscriptionCard";

const HEADING_CLASS = "mb-2.5 flex items-center gap-1.5 px-1 text-leaf-800";

export interface SubscriptionListProps {
  items: SubscriptionDto[];
  status: LoadStatus;
  loadError: string | null;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (item: SubscriptionDto) => void;
  onDelete: (item: SubscriptionDto) => void;
  /** Whether LINE reminders go out; the cards hide their reminder bell otherwise. */
  remindersActive: boolean;
}

/**
 * Subscription cards grouped under category headings, with loading, error and empty states. Subscriptions
 * paused or ended today are gathered in a last "已暫停／已到期" section instead, each card showing its
 * status and category.
 */
export function SubscriptionList({
  items,
  status,
  loadError,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
  remindersActive,
}: SubscriptionListProps) {
  const idPrefix = useId();
  const today = useToday();

  if (status === "loading" && items.length === 0) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="讀取中">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="glass h-28 animate-pulse rounded-[1.5rem]" />
        ))}
      </div>
    );
  }

  if (status === "error") return <LoadErrorNotice message={loadError} onRetry={onRetry} />;

  if (items.length === 0) return <EmptyState onAdd={onAdd} />;

  const { running, stopped } = splitByStatus(items, today === null ? null : toDateKey(today));
  const cardProps = { onEdit, onDelete, remindersActive };
  const stoppedHeadingId = `${idPrefix}-stopped`;

  return (
    <div className="flex flex-col gap-6">
      {groupByCategory(running).map(({ category, items: grouped }) => {
        const headingId = `${idPrefix}-category-${category.id}`;
        return (
          <section key={category.id} aria-labelledby={headingId}>
            <h3 id={headingId} className={HEADING_CLASS}>
              {category.icon && <span aria-hidden="true">{category.icon}</span>}
              {category.name}
            </h3>
            <ul className="flex flex-col gap-3">
              {grouped.map((item) => (
                <li key={item.id}>
                  <SubscriptionCard item={item} {...cardProps} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {stopped.length > 0 && (
        <section aria-labelledby={stoppedHeadingId}>
          <h3 id={stoppedHeadingId} className={HEADING_CLASS}>
            已暫停／已到期
          </h3>
          <ul className="flex flex-col gap-3">
            {stopped.map(({ item, status }) => (
              <li key={item.id}>
                <SubscriptionCard item={item} {...cardProps} status={status} showCategory />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
