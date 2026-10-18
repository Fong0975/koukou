import { fireEvent } from "@testing-library/react";

/**
 * Moves a pointer of the given type onto or off an element. jsdom has no PointerEvent, so a MouseEvent
 * carries the `pointerType`; React derives its pointer enter/leave events from these over/out events.
 *
 * @param element - The element the pointer enters or leaves.
 * @param action - "enter" or "leave".
 * @param pointerType - "mouse", "touch" or "pen".
 */
export function movePointer(element: Element, action: "enter" | "leave", pointerType: string): void {
  const event = new MouseEvent(action === "enter" ? "pointerover" : "pointerout", { bubbles: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(element, event);
}
