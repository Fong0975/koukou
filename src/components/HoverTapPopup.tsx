"use client";

import { useId, type ReactNode } from "react";
import { useHoverOrTapPopup } from "@/hooks/useHoverOrTapPopup";

/** Which edge of the trigger's wrapper the popup lines up with, so popups near a screen edge stay on screen. */
export type PopupAlign = "start" | "center" | "end";

const ALIGN_CLASSES: Record<PopupAlign, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

interface HoverTapPopupProps {
  /** Accessible name of the trigger button. */
  label: string;
  /** Content of the trigger button. */
  trigger: ReactNode;
  align: PopupAlign;
  /** Extra classes for the wrapper, which is positioned so the popup can sit under it. */
  className?: string;
  triggerClassName?: string;
  /** Content of the popup. */
  children: ReactNode;
}

/**
 * A button that pops up extra details under itself while a mouse hovers it, or after a tap until dismissed.
 *
 * @param props.label - The trigger's accessible name.
 * @param props.trigger - What the trigger shows.
 * @param props.align - Edge the popup lines up with.
 * @param props.className - Extra classes for the wrapper.
 * @param props.triggerClassName - Classes for the trigger button.
 * @param props.children - The popup's content.
 */
export function HoverTapPopup({
  label,
  trigger,
  align,
  className = "",
  triggerClassName,
  children,
}: HoverTapPopupProps) {
  const popupId = useId();
  const { ref, open, hoverProps, toggle } = useHoverOrTapPopup<HTMLDivElement>();

  return (
    <div ref={ref} className={`relative ${className}`} {...hoverProps}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        onClick={toggle}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div id={popupId} className={`popup ${ALIGN_CLASSES[align]}`}>
          {children}
        </div>
      )}
    </div>
  );
}
