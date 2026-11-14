import type { PaymentMethodDto } from "@/types/dto";
import { HoverTapPopup } from "../ui/HoverTapPopup";
import { InfoIcon } from "../ui/Icons";
import { ManagerRow, type ManagerRowControls } from "./ManagerRow";

interface PaymentMethodManagerRowProps extends ManagerRowControls {
  paymentMethod: PaymentMethodDto;
}

/**
 * One payment method in the manager: its name, usage badge and the move, edit and delete buttons.
 * A note shows as an info icon after the name that pops it up on hover or tap.
 */
export function PaymentMethodManagerRow({ paymentMethod, ...controls }: PaymentMethodManagerRowProps) {
  const { name, note } = paymentMethod;

  return (
    <ManagerRow name={name} inUseHint="使用中的扣款方式無法刪除" {...controls}>
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
    </ManagerRow>
  );
}
