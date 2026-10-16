import type { LoadStatus } from "@/hooks/useSubscriptions";
import type { SubscriptionDto } from "@/types/dto";
import { EmptyState } from "./EmptyState";
import { SubscriptionCard } from "./SubscriptionCard";

interface SubscriptionGridProps {
  items: SubscriptionDto[];
  status: LoadStatus;
  loadError: string | null;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (item: SubscriptionDto) => void;
  onDelete: (item: SubscriptionDto) => void;
}

const GRID = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

/**
 * Responsive grid of subscription cards, with loading, error and empty states.
 */
export function SubscriptionGrid({
  items,
  status,
  loadError,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: SubscriptionGridProps) {
  if (status === "loading" && items.length === 0) {
    return (
      <div className={GRID} aria-busy="true" aria-label="讀取中">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="glass h-64 animate-pulse rounded-[1.5rem]" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="glass mx-auto max-w-md rounded-[1.5rem] p-8 text-center">
        <h2 className="text-lg">讀不到扣款資料</h2>
        <p className="mt-2 text-ink-soft">{loadError}</p>
        <button type="button" className="btn btn-ghost mt-5" onClick={onRetry}>
          重新讀取
        </button>
      </div>
    );
  }

  if (items.length === 0) return <EmptyState onAdd={onAdd} />;

  return (
    <div className={GRID}>
      {items.map((item) => (
        <SubscriptionCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
