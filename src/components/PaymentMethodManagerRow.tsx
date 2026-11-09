import type { PaymentMethodDto } from "@/types/dto";
import { EditDeleteButtons } from "./EditDeleteButtons";
import { HoverTapPopup } from "./HoverTapPopup";
import { InfoIcon } from "./Icons";
import { MoveButtons } from "./MoveButtons";

interface PaymentMethodManagerRowProps {
  paymentMethod: PaymentMethodDto;
  /** A payment method some subscription uses can be edited but not deleted. */
  inUse: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * One payment method in the manager: its name, usage badge and the move, edit and delete buttons.
 * A note shows as an info icon after the name that pops it up on hover or tap.
 */
export function PaymentMethodManagerRow({
  paymentMethod,
  inUse,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: PaymentMethodManagerRowProps) {
  const { name, note } = paymentMethod;

  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 font-medium">
        <span className="min-w-0 break-words">{name}</span>
        {note && (
          <HoverTapPopup
            label={`${name} 的備註`}
            align="start"
            className="inline-flex"
            triggerClassName="inline-flex rounded-full text-ink-soft hover:text-ink"
            trigger={<InfoIcon className="size-4" />}
          >
            <p className="font-normal break-words whitespace-pre-line">{note}</p>
          </HoverTapPopup>
        )}
      </div>
      {inUse && <span className="shrink-0 text-xs text-ink-soft">使用中</span>}
      <div className="flex shrink-0">
        <MoveButtons
          name={name}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
        <EditDeleteButtons
          name={name}
          inUse={inUse}
          inUseHint="使用中的扣款方式無法刪除"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
