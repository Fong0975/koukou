"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { useDismiss } from "./useDismiss";

/**
 * Open state of a small popup that a mouse opens by hovering and a tap (or click) opens until dismissed.
 * Only mouse pointers count as hovering, because touch screens fire pointer enter right before the tap's
 * click, which would otherwise open and immediately toggle the popup closed again. While open, a press
 * outside the element behind `ref` or the Escape key closes it.
 *
 * @returns `ref` for the element wrapping the trigger and the popup, whether the popup is `open`,
 * `hoverProps` to spread on that element, and `toggle` for the trigger's click.
 */
export function useHoverOrTapPopup<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;

  const close = useCallback(() => {
    setHovered(false);
    setPinned(false);
  }, []);
  useDismiss(ref, open, close);

  const hoverWithMouse = (next: boolean) => (event: PointerEvent) => {
    if (event.pointerType === "mouse") setHovered(next);
  };

  return {
    ref,
    open,
    hoverProps: { onPointerEnter: hoverWithMouse(true), onPointerLeave: hoverWithMouse(false) },
    toggle: () => setPinned((current) => !current),
  };
}
