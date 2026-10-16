import { useId } from "react";
import type { LoadStatus } from "@/hooks/useSubscriptions";
import { groupByCategory } from "@/lib/groupByCategory";
import type { SubscriptionDto } from "@/types/dto";
import { EmptyState } from "./EmptyState";
import { LoadErrorNotice } from "./LoadErrorNotice";
import { SubscriptionCard } from "./SubscriptionCard";

export interface SubscriptionListProps {
  items: SubscriptionDto[];
  status: LoadStatus;
  loadError: string | null;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (item: SubscriptionDto) => void;
  onDelete: (item: SubscriptionDto) => void;
}

/**
 * Subscription cards grouped under category headings, with loading, error and empty states.
 */
export function SubscriptionList({
  items,
  status,
  loadError,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: SubscriptionListProps) {
  const idPrefix = useId();

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

  return (
    <div className="flex flex-col gap-6">
      {groupByCategory(items).map(({ category, items: grouped }) => {
        const headingId = `${idPrefix}-category-${category.id}`;
        return (
          <section key={category.id} aria-labelledby={headingId}>
            <h3 id={headingId} className="mb-2.5 flex items-center gap-1.5 px-1 text-leaf-800">
              {category.icon && <span aria-hidden="true">{category.icon}</span>}
              {category.name}
            </h3>
            <ul className="flex flex-col gap-3">
              {grouped.map((item) => (
                <li key={item.id}>
                  <SubscriptionCard item={item} onEdit={onEdit} onDelete={onDelete} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
