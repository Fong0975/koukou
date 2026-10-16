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
 * Wide glass card for one recurring payment: name, billing days, payment method and note on the left,
 * amount and edit/delete actions on the right. Stacks vertically on narrow screens.
 * The category is not shown, since cards are listed under their category heading.
 */
export function SubscriptionCard({ item, onEdit, onDelete }: SubscriptionCardProps) {
  const amount = formatAmount(item.currency, item.amount);

  return (
    <article
      className="glass stitched flex flex-col gap-3 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:gap-5"
      aria-labelledby={`sub-${item.id}-name`}
    >
      <div className="min-w-0 flex-1">
        <h4 id={`sub-${item.id}-name`} className="text-lg leading-snug break-words">
          {item.name}
        </h4>
        <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="扣款日">
          {item.schedules.map((schedule) => (
            <li key={schedule.id} className="rounded-full bg-coin-100/90 px-2.5 py-0.5 text-sm text-coin-600">
              {formatSchedule(schedule)}
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
          <CardIcon className="shrink-0" />
          <span>{PAYMENT_TYPE_LABELS[item.paymentMethod.type]}</span>
          <span className="truncate text-ink">{item.paymentMethod.name}</span>
        </p>
        {item.note && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{item.note}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-leaf-500/15 pt-3 sm:justify-end sm:border-0 sm:pt-0">
        <p className="flex items-center gap-2">
          <CoinMark currency={item.currency} />
          <span className="font-num text-sm font-medium text-ink-soft">{amount.prefix}</span>
          <span className="font-num text-2xl font-semibold tracking-tight tabular-nums">{amount.value}</span>
        </p>
        <div className="-mr-2 flex">
          <button type="button" className="icon-btn" onClick={() => onEdit(item)} aria-label={`編輯「${item.name}」`}>
            <PencilIcon />
          </button>
          <button type="button" className="icon-btn" onClick={() => onDelete(item)} aria-label={`刪除「${item.name}」`}>
            <TrashIcon />
          </button>
        </div>
      </div>
    </article>
  );
}
