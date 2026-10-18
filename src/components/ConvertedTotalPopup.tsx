import type { ConvertedPart } from "@/lib/format";
import { HoverTapPopup, type PopupAlign } from "./HoverTapPopup";
import { InfoIcon } from "./Icons";

interface ConvertedTotalPopupProps {
  /** The converted TWD total, e.g. "NT$ 1,500". */
  total: string;
  /** The per-currency amounts it was converted from. */
  breakdown: ConvertedPart[];
  align: PopupAlign;
  /** Extra classes for the wrapper, e.g. alignment or text size. */
  className?: string;
}

/**
 * A converted TWD total marked with an info icon, popping up the amounts it was converted from (one per line,
 * a foreign one followed by its TWD, e.g. "US$ 31.00 (NT$ 1,000)") on mouse hover or a tap, so the breakdown
 * takes no room until asked for.
 *
 * @param props.total - The converted total.
 * @param props.breakdown - The original amounts.
 * @param props.align - Edge the popup lines up with.
 * @param props.className - Extra classes for the wrapper.
 */
export function ConvertedTotalPopup({ total, breakdown, align, className = "" }: ConvertedTotalPopupProps) {
  return (
    <HoverTapPopup
      label={`${total}，查看換算前金額`}
      align={align}
      className={`flex font-num tabular-nums ${className}`}
      triggerClassName="inline-flex items-center gap-1 rounded-md"
      trigger={
        <>
          <InfoIcon className="size-[0.8em] shrink-0 text-ink-soft" />
          <span>{total}</span>
        </>
      }
    >
      <ul aria-label="換算前金額" className="flex flex-col gap-0.5">
        {breakdown.map(({ amount, twd }) => (
          <li key={amount}>
            {amount}
            {twd && <span className="text-ink-soft"> ({twd})</span>}
          </li>
        ))}
      </ul>
    </HoverTapPopup>
  );
}
