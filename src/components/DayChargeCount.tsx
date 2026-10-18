"use client";

import { useId } from "react";
import { useHoverOrTapPopup } from "@/hooks/useHoverOrTapPopup";
import type { Occurrence } from "@/lib/billingOccurrences";
import { IconLabel } from "./IconLabel";

/** Which edge of the day cell the popup lines up with, so popups of edge columns stay on screen. */
export type PopupAlign = "start" | "center" | "end";

const ALIGN_CLASSES: Record<PopupAlign, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

interface DayChargeCountProps {
  day: number;
  occurrences: Occurrence[];
  align: PopupAlign;
}

/**
 * Narrow-screen marker of a day's charges: a dot with the charge count that, on mouse hover or a tap,
 * pops up the names of the charges.
 *
 * @param props.day - Day of the month, used in the accessible names.
 * @param props.occurrences - Charges falling on this day; must not be empty.
 * @param props.align - Edge the popup lines up with.
 */
export function DayChargeCount({ day, occurrences, align }: DayChargeCountProps) {
  const popupId = useId();
  const { ref, open, hoverProps, toggle } = useHoverOrTapPopup<HTMLDivElement>();
  const label = `${day} 日扣款項目`;

  return (
    <div ref={ref} className="relative mt-1 sm:hidden" {...hoverProps}>
      <button
        type="button"
        aria-label={`${label}（${occurrences.length} 筆）`}
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        onClick={toggle}
        className="flex w-full items-center justify-center gap-1 rounded-md px-1 py-0.5 font-num text-xs text-coin-600"
      >
        <span className="size-1.5 rounded-full bg-coin-400" />
        {occurrences.length}
      </button>
      {open && (
        <ul
          id={popupId}
          aria-label={label}
          className={`absolute top-full z-20 mt-1 flex w-max max-w-44 flex-col gap-1 rounded-xl border border-leaf-500/20 bg-white/95 p-2 text-xs text-ink shadow-lg ${ALIGN_CLASSES[align]}`}
        >
          {occurrences.map(({ subscription, scheduleId }) => (
            <li key={`${subscription.id}-${scheduleId}`} className="break-words">
              <IconLabel icon={subscription.category.icon} label={subscription.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
