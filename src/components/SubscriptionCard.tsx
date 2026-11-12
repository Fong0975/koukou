import { formatAmount, formatSchedule } from "@/lib/format";
import { PAYMENT_TYPE_LABELS } from "@/lib/labels";
import type { PauseStatus } from "@/lib/pauses";
import type { SubscriptionDto } from "@/types/dto";
import { ContractEndNote } from "./ContractEndNote";
import { CardIcon, PencilIcon, TrashIcon } from "./Icons";
import { PauseStatusBadge } from "./PauseStatusBadge";
import { ReminderBadge } from "./ReminderBadge";

interface SubscriptionCardProps {
  item: SubscriptionDto;
  onEdit: (item: SubscriptionDto) => void;
  onDelete: (item: SubscriptionDto) => void;
  /** Whether LINE reminders go out; the bell is hidden otherwise, since nothing would be sent. */
  remindersActive: boolean;
  /** Whether the subscription is paused or cancelled today; the card is dimmed and labelled then. */
  pauseStatus?: PauseStatus | null;
  /** Shows the category under the name, for lists not grouped under category headings. */
  showCategory?: boolean;
}

/**
 * Wide glass card for one recurring payment: name (with a bell when it has active LINE reminders), billing days,
 * payment method, contract end date and note on the left, amount and edit/delete actions on the right. Stacks
 * vertically on narrow screens. The category is shown only with `showCategory`, since cards are normally listed
 * under their category heading. A paused or cancelled subscription is dimmed and carries a status pill.
 */
export function SubscriptionCard({
  item,
  onEdit,
  onDelete,
  remindersActive,
  pauseStatus = null,
  showCategory = false,
}: SubscriptionCardProps) {
  const amount = formatAmount(item.currency, item.amount);

  return (
    <article
      className={`glass stitched flex flex-col gap-3 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:gap-5 ${
        pauseStatus ? "opacity-75" : ""
      }`}
      aria-labelledby={`sub-${item.id}-name`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 id={`sub-${item.id}-name`} className="min-w-0 text-lg leading-snug break-words">
            {item.name}
          </h4>
          {remindersActive && <ReminderBadge reminders={item.reminders} />}
          {pauseStatus && <PauseStatusBadge status={pauseStatus} />}
        </div>
        {showCategory && (
          <p className="mt-1 text-sm text-ink-soft">
            {item.category.icon && <span aria-hidden="true">{item.category.icon} </span>}
            {item.category.name}
          </p>
        )}
        <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="扣款日">
          {item.schedules.map((schedule) => (
            <li key={schedule.id} className="rounded-full bg-coin-100/90 px-2.5 py-0.5 text-sm text-coin-600">
              {formatSchedule(schedule)}
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-center gap-2 px-2 text-sm text-ink-soft">
          <CardIcon className="shrink-0" />
          <span>{PAYMENT_TYPE_LABELS[item.paymentMethod.type]}</span>
          <span className="min-w-0 break-words text-ink">{item.paymentMethod.name}</span>
        </p>
        {item.contractEndDate && <ContractEndNote date={item.contractEndDate} />}
        {item.note && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{item.note}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-leaf-500/15 pt-3 sm:justify-end sm:border-0 sm:pt-0">
        <p className="flex items-center gap-2">
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
