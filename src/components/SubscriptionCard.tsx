import { formatAmount, formatSchedule } from "@/lib/format";
import { PAYMENT_TYPE_LABELS } from "@/lib/labels";
import type { SubscriptionDto } from "@/types/dto";
import { CoinMark } from "./CoinMark";
import { CardIcon, PencilIcon, TrashIcon } from "./Icons";

interface SubscriptionCardProps {
  item: SubscriptionDto;
  onEdit: (item: SubscriptionDto) => void;
  onDelete: (item: SubscriptionDto) => void;
}

/**
 * Glass card showing one recurring payment: category, name, amount, billing days and payment method.
 */
export function SubscriptionCard({ item, onEdit, onDelete }: SubscriptionCardProps) {
  const amount = formatAmount(item.currency, item.amount);

  return (
    <article
      className="glass stitched flex flex-col gap-4 rounded-[1.5rem] p-6"
      aria-labelledby={`sub-${item.id}-name`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100/80 px-3 py-1 text-sm text-leaf-800">
          {item.category.icon && <span aria-hidden="true">{item.category.icon}</span>}
          {item.category.name}
        </span>
        <div className="-mt-1 -mr-2 flex">
          <button type="button" className="icon-btn" onClick={() => onEdit(item)} aria-label={`編輯「${item.name}」`}>
            <PencilIcon />
          </button>
          <button type="button" className="icon-btn" onClick={() => onDelete(item)} aria-label={`刪除「${item.name}」`}>
            <TrashIcon />
          </button>
        </div>
      </div>

      <div>
        <h2 id={`sub-${item.id}-name`} className="text-xl leading-snug break-words">
          {item.name}
        </h2>
        <p className="mt-2 flex items-center gap-2.5">
          <CoinMark currency={item.currency} />
          <span className="font-num text-sm font-medium text-ink-soft">{amount.prefix}</span>
          <span className="font-num text-3xl font-semibold tracking-tight tabular-nums">{amount.value}</span>
        </p>
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="扣款日">
        {item.schedules.map((schedule) => (
          <li key={schedule.id} className="rounded-full bg-coin-100/90 px-2.5 py-1 text-sm text-coin-600">
            {formatSchedule(schedule)}
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-leaf-500/15 pt-3 text-sm text-ink-soft">
        <p className="flex items-center gap-2">
          <CardIcon className="shrink-0" />
          <span>{PAYMENT_TYPE_LABELS[item.paymentMethod.type]}</span>
          <span className="truncate text-ink">{item.paymentMethod.name}</span>
        </p>
        {item.note && <p className="mt-1.5 line-clamp-2">{item.note}</p>}
      </div>
    </article>
  );
}
