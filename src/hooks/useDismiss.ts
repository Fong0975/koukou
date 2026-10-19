"use client";

import { useEffect, type RefObject } from "react";

/**
 * While `open`, calls `onDismiss` when a pointer presses outside the element behind `ref`
 * or the Escape key is pressed, the usual ways to close a popup or menu.
 *
 * @param ref - The element wrapping the trigger and the popup; presses inside it are ignored.
 * @param open - Whether the popup is open; nothing is listened to while closed.
 * @param onDismiss - Closes the popup; keep it stable (e.g. with useCallback) to avoid re-subscribing.
 */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void): void {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: Event) => {
      if (!ref.current?.contains(event.target as Node)) onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, open, onDismiss]);
}
